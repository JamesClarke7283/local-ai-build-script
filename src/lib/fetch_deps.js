#!/usr/bin/env bun

import axios from 'axios';
import cheerio from 'cheerio';

const GO_DL_BASE_URL = 'https://go.dev/dl/';

export async function fetch_go_releases() {
    try {
        const { data } = await axios.get(GO_DL_BASE_URL);
        const $ = cheerio.load(data);

        const releases = [];
        const stableVersionsSection = $('#stable').next('div.toggleVisible[id^="go"]');
        
        const version = stableVersionsSection.attr('id').replace('go', '');
        const files = [];

        stableVersionsSection.find('table.downloadtable tbody tr').each((i, row) => {
            const file = {};
            const fileType = $(row).find('td:nth-child(2)').text().trim();
            const os = $(row).find('td:nth-child(3)').text().trim();
            
            if (fileType !== 'Source' && os === 'Linux') {
                file['arch'] = $(row).find('td:nth-child(4)').text().trim().toLowerCase();
                file['sha256'] = $(row).find('td:nth-child(6)').text().trim();
                file['url'] = `${GO_DL_BASE_URL}${$(row).find('td.filename a').attr('href').split('/').pop()}`;
                files.push(file);
            }
        });

        releases.push({ version, files });

        return releases;
    } catch (error) {
        console.error('Error fetching Go releases:', error);
        return [];
    }
}