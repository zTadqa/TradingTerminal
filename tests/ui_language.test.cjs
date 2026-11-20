const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function language(lang){
 const body={nodeType:1,closest(){return null},querySelectorAll(){return []},hasAttribute(){return false}};
 const document={body,documentElement:{},createTreeWalker(){return {nextNode(){return null}}}};
 const ctx=vm.createContext({Workspace:{read:()=>lang,write:()=>true},document,NodeFilter:{SHOW_TEXT:4,FILTER_ACCEPT:1,FILTER_REJECT:2}});
 vm.runInContext(fs.readFileSync('frontend/js/ui_language.js','utf8')+';this.api=TerminalLanguage;',ctx);return ctx.api;
}
test('English UI translates new order, calendar, status and composed labels',()=>{
 const en=language('en');
 assert.equal(en.text('Xác nhận mua'),'Confirm buy');
 assert.equal(en.text('Hôm nay không có tin phù hợp với bộ lọc.'),'No events today match the selected filters.');
 assert.equal(en.text('Đang chờ giá live'),'Waiting for live price');
 assert.equal(en.text('3 hợp đồng'),'3 contracts');
 assert.equal(en.text('NQ1! · Giá vào 27,756.00'),'NQ1! · Entry price 27,756.00');
 assert.equal(en.text('NQ1!'),'NQ1!');
 assert.equal(en.text('27,756.00'),'27,756.00');
});
test('Vietnamese setting remains available and selected language can be saved',()=>{
 const vi=language('vi');assert.equal(vi.text('Settings'),'Cài đặt');assert.equal(vi.save('en'),true);assert.equal(vi.save('unknown'),false);
});
