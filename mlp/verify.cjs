/* Numerical verification and reproducible experiment generation. Run node verify.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {MLP,train,defaults} = require('./core.js');
let maxGradientError=0;
for (const hidden of [0,2,4,8]) for (const activation of ['sigmoid','tanh']) {
  const m = new MLP({hidden,activation,init:'random'});
  for(let i=0;i<7;i++)m.step();
  const analytic=m.evaluate().grad,eps=1e-5;
  m.p.forEach((p,i)=>{m.p[i]=p+eps;const plus=m.evaluate().loss;m.p[i]=p-eps;const minus=m.evaluate().loss;m.p[i]=p;const error=Math.abs((plus-minus)/(2*eps)-analytic[i]);maxGradientError=Math.max(error,maxGradientError);assert.ok(error<1e-8,`gradient ${hidden}/${activation}/${i}: ${error}`);});
}
const settings=[
  ['课程配置 · Adam 0.03',{}],
  ['较小学习率 · Adam 0.003',{lr:.003}],
  ['较大学习率 · Adam 0.3',{lr:.3}],
  ['优化器对照 · SGD 0.03',{optimizer:'sgd'}],
  ['随机初始化 · 2 隐藏单元',{init:'random'}],
  ['线性对照 · 无隐藏层',{hidden:0,init:'random'}]
];
const runs=settings.map(([name,c])=>{
  const r=train(c),first=r.history.find(s=>s.accuracy===1);
  return {name,config:r.config,parameterOrder:r.names,initial:r.history[0],final:r.history.at(-1),firstPerfectEpoch:first?.epoch??null,firstPerfectLoss:first?.loss??null,lossHistoryColumns:["epoch","loss","accuracy"],lossHistory:r.history.map(s=>[s.epoch,s.loss,s.accuracy])};
});
const base=runs[0];
assert.equal(base.final.accuracy,1);
assert.ok(base.final.loss<.03);
assert.deepEqual(base.final.predictions.map(p=>p.label),[0,1,1,0]);
assert.ok(Math.abs(runs.at(-1).final.loss-Math.log(2))<1e-14);
assert.deepEqual(train().history.at(-1),base.final);
const firstStep=new MLP(),initial=firstStep.snapshot(),after=firstStep.step();
initial.grad.forEach((g,i)=>assert.ok(Math.abs(after.p[i]-(initial.p[i]-.03*g/(Math.abs(g)+1e-8)))<1e-12));
let configurationChecks=0;
for(const hidden of [0,2,4,8])for(const activation of ['sigmoid','tanh'])for(const optimizer of ['adam','sgd'])for(const lr of [.003,.01,.03,.1,.3])for(const init of ['course','random']){
  configurationChecks++;const r=train({hidden,activation,optimizer,lr,init,epochs:300});assert.ok(Number.isFinite(r.history.at(-1).loss));
}
const result={generated:'2026-11-17',source:'core.js',precision:'IEEE-754 float64',settings:defaults,note:'All four XOR samples are used for training. No test-set accuracy is claimed.',runs};
fs.writeFileSync(path.join(__dirname,'experiments.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({gradientMaxAbsoluteError:maxGradientError,configurationChecks,defaultFirstPerfectEpoch:base.firstPerfectEpoch,defaultLoss:base.final.loss,predictions:base.final.predictions.map(p=>p.prob),runs:runs.map(r=>({name:r.name,loss:r.final.loss,accuracy:r.final.accuracy}))},null,2));
