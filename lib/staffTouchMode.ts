/** Pure, testable detection shared by the installed staff shell and calendar. */
export type StaffTouchModeInput={
 standalone:boolean;
 fullscreen:boolean;
 iosStandalone:boolean;
 coarsePointer:boolean;
 touchPoints:number;
 screenWidth:number;
 screenHeight:number;
 viewportWidth:number;
};
export function staffTouchMode(input:StaffTouchModeInput){
 const installed=input.standalone||input.fullscreen||input.iosStandalone;
 const physicalWidth=Math.min(input.screenWidth,input.screenHeight);
 const touch=input.coarsePointer||input.touchPoints>0;
 // Keep larger touchscreen laptops/desktop installations in the desktop shell.
 const installedTouch=installed&&touch&&physicalWidth>0&&physicalWidth<=900;
 return {
  installedTouch,
  virtualDesktopViewport:installedTouch&&input.viewportWidth>Math.max(780,physicalWidth*1.35)
 };
}
/** Reads browser mode without assuming viewport width is the physical phone width. */
export function readStaffTouchMode(){
 return staffTouchMode({
  standalone:window.matchMedia('(display-mode: standalone)').matches,
  fullscreen:window.matchMedia('(display-mode: fullscreen)').matches,
  iosStandalone:(navigator as Navigator&{standalone?:boolean}).standalone===true,
  coarsePointer:window.matchMedia('(pointer: coarse)').matches,
  touchPoints:navigator.maxTouchPoints||0,
  screenWidth:window.screen.width,
  screenHeight:window.screen.height,
  viewportWidth:window.innerWidth
 });
}
