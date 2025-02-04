import Tippy from "@tippyjs/react";
import { applyToAllBuildings, getCompletedBuilding } from "../../../shared/logic/BuildingLogic";
import { Config } from "../../../shared/logic/Config";
import type { GameState } from "../../../shared/logic/GameState";
import { notifyGameOptionsUpdate } from "../../../shared/logic/GameStateLogic";
import { getGrid } from "../../../shared/logic/IntraTickCache";
import type { IBuildingData } from "../../../shared/logic/Tile";
import { pointToTile, sizeOf, tileToPoint, type Tile } from "../../../shared/utilities/Helper";
import { L, t } from "../../../shared/utilities/i18n";
import { useGameOptions } from "../Global";
import { WorldScene } from "../scenes/WorldScene";
import { Singleton } from "../utilities/Singleton";
import { playClick } from "../visuals/Sound";
import { showToast } from "./GlobalModal";

export function ApplyToAllComponent<T extends IBuildingData>({
   xy,
   getOptions,
   gameState,
}: {
   xy: Tile;
   getOptions: (s: T) => Partial<T>;
   gameState: GameState;
}): React.ReactNode {
   const building = gameState.tiles.get(xy)?.building as T;
   if (!building) {
      return null;
   }
   const def = Config.Building[building.type];
   const options = useGameOptions();
   const property = getOptions(building);
   console.assert(sizeOf(property) === 1);
   return (
      <div className="text-small row">
         <Tippy content={t(L.ApplyToAllBuilding, { building: def.name() })}>
            <button
               style={{ width: 27, padding: 0 }}
               onClick={() => {
                  playClick();
                  const count = applyToAllBuildings(building.type, getOptions, gameState);
                  showToast(t(L.ApplyToBuildingsToastHTML, { count, building: def.name() }));
               }}
            >
               <div className="m-icon small">sync</div>
            </button>
         </Tippy>
         {[1, 2, 3, 4, 5].map((tile) => {
            return (
               <Tippy key={tile} content={t(L.ApplyToBuildingInTile, { building: def.name(), tile })}>
                  <button
                     className="row jcc"
                     style={{ width: 27, padding: 0 }}
                     onMouseEnter={() => {
                        Singleton()
                           .sceneManager.getCurrent(WorldScene)
                           ?.drawSelection(
                              null,
                              getGrid(gameState)
                                 .getRange(tileToPoint(xy), tile)
                                 .map((p) => pointToTile(p))
                                 .filter((xy) => getCompletedBuilding(xy, gameState)?.type === building.type),
                           );
                     }}
                     onMouseLeave={() => {
                        Singleton().sceneManager.getCurrent(WorldScene)?.drawSelection(null, []);
                     }}
                     onClick={() => {
                        playClick();
                        let count = 0;
                        getGrid(gameState)
                           .getRange(tileToPoint(xy), tile)
                           .map((p) => getCompletedBuilding(pointToTile(p), gameState))
                           .forEach((b) => {
                              if (b?.type === building.type) {
                                 ++count;
                                 Object.assign(b, getOptions(building));
                              }
                           });
                        showToast(t(L.ApplyToBuildingsToastHTML, { count, building: def.name() }));
                     }}
                  >
                     {tile}
                  </button>
               </Tippy>
            );
         })}
         <div className="f1"></div>
         <Tippy
            content={t(L.SetAsDefaultBuilding, {
               building: def.name(),
            })}
         >
            <button
               style={{ width: 27, padding: 0 }}
               onClick={() => {
                  playClick();
                  const defaults = options.buildingDefaults;
                  if (!defaults[building.type]) {
                     defaults[building.type] = {};
                  }
                  Object.assign(defaults[building.type]!, getOptions(building));
                  notifyGameOptionsUpdate();
               }}
            >
               <div className="m-icon small">settings_heart</div>
            </button>
         </Tippy>
      </div>
   );
}
