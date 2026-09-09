export const assets=[
{symbol:'NVDA',name:'NVIDIA',mark:'N',price:182.42,change:3.24,category:'AI & tech',color:'#dceac6',ink:'#425e29',tag:'The engine behind your AI',description:'From the models you prompt to the worlds you play in. Explore the company building the chips behind them.',volume:'2.4M'},
{symbol:'AAPL',name:'Apple',mark:'a',price:231.18,change:1.08,category:'Everyday',color:'#e7e5e1',ink:'#252529',tag:'Part of your everyday',description:'The devices, services, and little rituals that connect your day.',volume:'1.8M'},
{symbol:'MSFT',name:'Microsoft',mark:'⊞',price:508.65,change:1.82,category:'AI & tech',color:'#e6e4f8',ink:'#7060b0',tag:'Work. Play. Make things.',description:'Cloud infrastructure, creative tools, gaming, and a growing AI ecosystem.',volume:'1.1M'},
{symbol:'AMZN',name:'Amazon',mark:'a↗',price:224.36,change:-0.64,category:'Everyday',color:'#f4e4d2',ink:'#8a542b',tag:'From your doorstep to the cloud',description:'A familiar delivery box, and the cloud infrastructure powering the internet.',volume:'920K'},
{symbol:'GOOGL',name:'Alphabet',mark:'G',price:205.87,change:2.16,category:'AI & tech',color:'#e4ebf4',ink:'#4877b0',tag:'Follow your curiosity',description:'Search, video, AI, and the tools you reach for every day.',volume:'860K'},
{symbol:'META',name:'Meta',mark:'∞',price:748.12,change:-1.12,category:'Culture',color:'#e0eafa',ink:'#5271a8',tag:'Where your worlds meet',description:'Social platforms, open models, and experiments in the next computing interface.',volume:'740K'}
];
export function series(seed=1,count=48){return Array.from({length:count},(_,i)=>52-i*.55+Math.sin(i*1.7+seed)*7+Math.cos(i*.5+seed)*9);}
export const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n);
