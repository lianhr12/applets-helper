export default class PubSub {
 constructor() {
  this.PubSubCache = {
   eid: 0
  };
 }
 
 on(type, handler) {
  let cache = this.PubSubCache[type] || (this.PubSubCache[type] = {});
 
  handler.eid = handler.eid || this.PubSubCache.eid++;
  cache[handler.eid] = handler;
 }
 
 emit(type, ...params) {
  const cache = this.PubSubCache[type];
 
  if(!cache) return;
 
  for(let key in cache) {
   cache[key].call(this, ...params);
  }
 }
 
 off(type, handler) {
  
  let cache = this.PubSubCache[type];
 
  if(handler == null) {
   if(!cache) return true;
   return !!this.PubSubCache[type] && (delete this.PubSubCache[type]);
  } else {
   !!this.PubSubCache[type] && (delete this.PubSubCache[type][handler.eid]);
  }
 
  let counter = 0;
  for(let key in cache) {
   counter++;
  }
 
  return !counter && (delete this.PubSubCache[type]);
 }
}