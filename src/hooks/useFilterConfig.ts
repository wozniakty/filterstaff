import { useState, useCallback, useEffect } from "react";
import type {
  FilterConfig,
  PlayerClass,
  EquipmentType,
  AffixCategory,
} from "../types";
import { DEFAULT_FILTER_CONFIG } from "../data/defaults";

const STORAGE_KEY = "filterstaff-config";

function loadConfig(): FilterConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_FILTER_CONFIG;
    const parsed = JSON.parse(saved);
    // Merge saved user selections onto current defaults
    // so new default changes (beam sizes, etc.) take effect
    return {
      ...DEFAULT_FILTER_CONFIG,
      name: parsed.name ?? DEFAULT_FILTER_CONFIG.name,
      playerClass: parsed.playerClass ?? DEFAULT_FILTER_CONFIG.playerClass,
      weaponTypes: parsed.weaponTypes ?? DEFAULT_FILTER_CONFIG.weaponTypes,
      buildDefiningAffixIds: parsed.buildDefiningAffixIds ?? [],
      badAffixIds: parsed.badAffixIds ?? [],
      customRules: parsed.customRules ?? [],
    };
  } catch {
    return DEFAULT_FILTER_CONFIG;
  }
}

export function useFilterConfig() {
  const [config, setConfig] = useState<FilterConfig>(loadConfig);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const setName = useCallback((name: string) => {
    setConfig((prev) => ({ ...prev, name }));
  }, []);

  const setPlayerClass = useCallback((playerClass: PlayerClass) => {
    setConfig((prev) => ({ ...prev, playerClass }));
  }, []);

  const setWeaponTypes = useCallback((weaponTypes: EquipmentType[]) => {
    setConfig((prev) => ({ ...prev, weaponTypes }));
  }, []);

  const toggleWeaponType = useCallback((wt: EquipmentType) => {
    setConfig((prev) => ({
      ...prev,
      weaponTypes: prev.weaponTypes.includes(wt)
        ? prev.weaponTypes.filter((w) => w !== wt)
        : [...prev.weaponTypes, wt],
    }));
  }, []);

  const setAffixCategory = useCallback(
    (affixId: number, category: AffixCategory) => {
      setConfig((prev) => {
        const bd = prev.buildDefiningAffixIds.filter((id) => id !== affixId);
        const bad = prev.badAffixIds.filter((id) => id !== affixId);

        if (category === "build-defining") bd.push(affixId);
        else if (category === "bad") bad.push(affixId);

        return {
          ...prev,
          buildDefiningAffixIds: bd,
          badAffixIds: bad,
        };
      });
    },
    []
  );

  const setAffixCategoryBulk = useCallback(
    (affixIds: number[], category: AffixCategory) => {
      setConfig((prev) => {
        const idSet = new Set(affixIds);
        const bd = prev.buildDefiningAffixIds.filter((id) => !idSet.has(id));
        const bad = prev.badAffixIds.filter((id) => !idSet.has(id));

        if (category === "build-defining") bd.push(...affixIds);
        else if (category === "bad") bad.push(...affixIds);

        return {
          ...prev,
          buildDefiningAffixIds: bd,
          badAffixIds: bad,
        };
      });
    },
    []
  );

  const getAffixCategory = useCallback(
    (affixId: number): AffixCategory => {
      if (config.buildDefiningAffixIds.includes(affixId)) return "build-defining";
      if (config.badAffixIds.includes(affixId)) return "bad";
      return "unlabeled";
    },
    [config.buildDefiningAffixIds, config.badAffixIds]
  );

  const cycleAffixCategory = useCallback(
    (affixId: number) => {
      const current = getAffixCategory(affixId);
      const next: AffixCategory =
        current === "unlabeled"
          ? "build-defining"
          : current === "build-defining"
            ? "bad"
            : "unlabeled";
      setAffixCategory(affixId, next);
    },
    [getAffixCategory, setAffixCategory]
  );

  const importConfig = useCallback((imported: Partial<FilterConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...DEFAULT_FILTER_CONFIG,
      name: imported.name ?? prev.name,
      playerClass: imported.playerClass ?? prev.playerClass,
      weaponTypes: imported.weaponTypes ?? prev.weaponTypes,
      buildDefiningAffixIds: imported.buildDefiningAffixIds ?? prev.buildDefiningAffixIds,
      badAffixIds: imported.badAffixIds ?? prev.badAffixIds,
      customRules: imported.customRules ?? prev.customRules,
    }));
  }, []);

  const setCustomRules = useCallback((customRules: string[]) => {
    setConfig((prev) => ({ ...prev, customRules }));
  }, []);

  const clearCustomRules = useCallback(() => {
    setConfig((prev) => ({ ...prev, customRules: [] }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_FILTER_CONFIG);
  }, []);

  return {
    config,
    setConfig,
    setName,
    setPlayerClass,
    setWeaponTypes,
    toggleWeaponType,
    setAffixCategory,
    setAffixCategoryBulk,
    getAffixCategory,
    cycleAffixCategory,
    importConfig,
    setCustomRules,
    clearCustomRules,
    resetConfig,
  };
}
