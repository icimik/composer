const {test,expect,_electron}=require('@playwright/test');
const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
test('desktop visual evidence: modes, minimum size and key states',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'composer-visual-'));
  const app=await _electron.launch({args:[...(process.platform==='linux'?['--no-sandbox']:[]),'.'],cwd:path.resolve(__dirname,'../..'),env:{...process.env,ELECTRON_RUN_AS_NODE:'',COMPOSER_E2E:'1',COMPOSER_TEST_ROOT:root}});
  try{
    const page=await app.firstWindow();await expect(page.getByTestId('composer-app')).toBeVisible();
    await page.getByLabel('文档标题').fill('第一章 · 迟来的信');
    await page.getByLabel('正文编辑器').fill('雨停在凌晨四点。\n\n林遥推开邮局的门，鞋底带进一串水印。柜台后的老人没抬头，只把一封信推到灯下。\n\n“你的。”\n\n信封上的名字是她的。邮戳却是二十年前。\n\n她没有伸手。窗外，第一班渡船响了笛。');
    await expect(page.getByTestId('save-status')).toHaveText(/已保存/);
    const folder=path.resolve('docs/research/screenshots');await fs.mkdir(folder,{recursive:true});
    await page.screenshot({path:path.join(folder,'desktop-light.png')});
    await page.getByRole('button',{name:'切换明暗主题'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.waitForTimeout(180);
    await page.screenshot({path:path.join(folder,'desktop-dark.png')});
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(900,640));
    await page.waitForTimeout(150);await page.screenshot({path:path.join(folder,'minimum-window.png')});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const bounds=await page.getByLabel('正文编辑器').boundingBox();expect(bounds.width).toBeGreaterThan(250);
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1500,960));
    await page.getByRole('button',{name:'结构总览',exact:true}).click();await page.screenshot({path:path.join(folder,'outline.png')});
    await page.getByRole('button',{name:/阶段检查/}).click();await page.screenshot({path:path.join(folder,'review.png')});
    await page.getByRole('button',{name:'模型设置',exact:true}).click();await page.screenshot({path:path.join(folder,'settings.png')});
    await page.keyboard.press('Escape');await page.getByRole('button',{name:'创作',exact:true}).click();
    // No layout overlap at 200% zoom; this is separate from native system DPI testing.
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(2));
    await page.waitForTimeout(150);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:path.join(folder,'zoom-200.png')});
  }finally{await app.close();await fs.rm(root,{recursive:true,force:true});}
});
