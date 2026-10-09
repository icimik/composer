const { defineConfig }=require('@playwright/test');
module.exports=defineConfig({
  testDir:'tests/e2e',fullyParallel:false,workers:1,timeout:45000,
  expect:{timeout:10000},reporter:[['list'],['html',{open:'never'}]],
  use:{trace:'retain-on-failure',screenshot:'only-on-failure'},
  outputDir:'test-results'
});
