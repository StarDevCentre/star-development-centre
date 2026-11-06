/** Guard async requests when users switch sessions or a component unmounts. */
export function createRequestSequence() {
 let current=0;
 return {
  next(){return ++current;},
  isCurrent(request:number){return request===current;},
  invalidate(){current++;}
 };
}
