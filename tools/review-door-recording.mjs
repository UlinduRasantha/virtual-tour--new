import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
const data = await readFile('C:/Users/User/AppData/Local/Packages/Microsoft.ScreenSketch_8wekyb3d8bbwe/TempState/Recordings/20261015-0808-11.1690074.mp4');
await mkdir('source-scans/house2-review', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  await page.route('http://recording.local/**', route => {
    if (!route.request().url().endsWith('.mp4')) return route.fulfill({contentType:'text/html',body:'<body style="margin:0;background:black"><video src="/recording.mp4" controls style="width:1100px;height:700px"></video></body>'});
    const range = route.request().headers().range;
    if (range) {
      const match = /bytes=(\d+)-(\d*)/.exec(range), start = Number(match[1]), end = match[2] ? Number(match[2]) : data.length - 1;
      return route.fulfill({status:206,contentType:'video/mp4',headers:{'Content-Range':`bytes ${start}-${end}/${data.length}`,'Accept-Ranges':'bytes'},body:data.subarray(start,end+1)});
    }
    return route.fulfill({contentType:'video/mp4',body:data});
  });
  await page.goto('http://recording.local/');
  await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
  const duration=await page.evaluate(()=>document.querySelector('video').duration);
  console.log({duration});
  for (let i=0;i<8;i++) {
    const time=(i+0.5)*duration/8;
    await page.evaluate(time=>new Promise(resolve=>{const v=document.querySelector('video');v.onseeked=resolve;v.currentTime=time;}),time);
    await page.screenshot({path:`source-scans/house2-review/frame-${i}.png`});
  }
} finally {await browser.close();}
