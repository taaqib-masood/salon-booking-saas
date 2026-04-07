```javascript
import puppeteer from 'puppeteer-core';
import handlebars from 'handlebars';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import ReportModel from '../models/report.js';
import AggregationModel from '../models/aggregation.js';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export async function generateReport(reportId) {
    const report = await ReportModel.findById(reportId);
    
    if (!report) throw new Error('Report not found');
    
    const aggregationData = await AggregationModel.aggregate([{ $match: {} }]); // replace with your own aggregations
    
    const templateSource = report.template; // assuming Report model has a 'template' field which contains the handlebars template string
    const template = handlebars.compile(templateSource);
    const html = template({ data: aggregationData });
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    
    const s3Params = {
        Bucket: process.env.S3_BUCKET,
        Key: `${reportId}.pdf`,
        Body: pdfBuffer,
        ContentType: 'application/pdf'
    };
    
    await s3Client.send(new PutObjectCommand(s3Params));
    
    const command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: `${reportId}.pdf` });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL will expire after 1 hour
    
    report.status = 'COMPLETED';
    report.url = signedUrl;
    await report.save();
}
```