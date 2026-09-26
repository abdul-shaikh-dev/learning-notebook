'use strict';
const StoryMath = {
 positions(step, price){const bought=step===0?10:15,sold=step===2?4:0,quantity=bought-sold,cost=100,proceeds=sold*110;return {bought,sold,quantity,cost,proceeds,cash:proceeds-bought*cost,value:quantity*price,realised:sold*(110-cost),unrealised:quantity*(price-cost),total:sold*(110-cost)+quantity*(price-cost)};},
 adjustments(booked,gross,sameSource){const eligible=sameSource?booked:0;return {raw:100000,fairValue:100000-booked,openingFairValue:99000,movement:1000-booked,eligible,increment:Math.max(0,gross-eligible)};}
};
if(typeof module!=='undefined')module.exports=StoryMath;
