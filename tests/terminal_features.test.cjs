const test=require('node:test'),assert=require('node:assert/strict');
global.MarketData=require('../frontend/js/market_data.js');
const {TerminalTime}=require('../frontend/js/terminal_features.js');
const bar=time=>({time,open:10,high:12,low:9,close:11,volume:1});
test('mixed timeframe replay only releases native candles at their closing timestamp',()=>{
 const start=Date.parse('2026-11-11T15:00:00Z')/1000;
 const minute=Array.from({length:15},(_,i)=>bar(start+i*60));const five=[bar(start),bar(start+300),bar(start+600)];
 assert.equal(TerminalTime.closedIndex(minute,'1m',{},start+299),4);
 assert.equal(TerminalTime.closedIndex(five,'5m',{},start+299),0);
 assert.equal(TerminalTime.closedIndex(minute,'1m',{},start+300),5);
 assert.equal(TerminalTime.closedIndex(five,'5m',{},start+300),1);
 assert.equal(TerminalTime.closedIndex(five,'5m',{},start+300-1),0);
});
test('monthly and quarterly closing dates use real calendar lengths and exchange timezone',()=>{
 const metadata={timezone:'America/Chicago',session:'1700-1600'};
 assert.equal(new Date(TerminalTime.end(bar(Date.parse('2026-02-01T00:00:00Z')/1000),'1M',metadata)*1000).toISOString(),'2026-02-27T22:00:00.000Z');
 assert.equal(new Date(TerminalTime.end(bar(Date.parse('2026-01-01T00:00:00Z')/1000),'3M',metadata)*1000).toISOString(),'2026-03-31T21:00:00.000Z');
});
test('intraday countdown stops at exchange session close instead of overcounting an incomplete 4h bar',()=>{
 const metadata={timezone:'America/Chicago',session:'1700-1600'};
 const start=Date.parse('2026-11-11T19:00:00Z')/1000;
 assert.equal(TerminalTime.end(bar(start),'4h',metadata),Date.parse('2026-11-11T22:00:00Z')/1000);
});
const {TerminalReplay}=require('../frontend/js/terminal_features.js');
test('replay peer markets exclude future OHLC across assets and timeframes',()=>{
 const start=Date.parse('2026-11-11T15:00:00Z')/1000;
 const replay=Object.create(TerminalReplay.prototype);replay.clock=start+300;replay.marketVersion=1;
 const cache=new Map([['NQ1!',{'1m':[bar(start),bar(start+300)],metadata:{}}],['ES1!',{'5m':[bar(start),bar(start+300)],metadata:{}}]]);
 const result=replay.markets(cache);
 assert.equal(result['NQ1!']['1m'].length,1);assert.equal(result['ES1!']['5m'].length,1);
 assert.equal(cache.get('NQ1!')['1m'].length,2);
 assert.equal(replay.markets(cache),result);
 replay.clock=start+299;assert.equal(replay.markets(cache)['ES1!']['5m'].length,0);
});
test('countdown honors a native early-close correction',()=>{
 const metadata={timezone:'America/Chicago',session:'1700-1600',sessionCorrections:'1700F2-1200F1,1700-1215:20261127'};
 const value=TerminalTime.end(bar(Date.parse('2026-11-27T00:00:00Z')/1000),'D',metadata);
 assert.equal(new Date(value*1000).toISOString(),'2026-11-27T18:15:00.000Z');
});
