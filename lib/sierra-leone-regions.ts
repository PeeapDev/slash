export interface SierraLeoneRegion {
  id: string
  name: string
  code: string
  districts: {
    id: string
    name: string
    code: string
  }[]
}

export const SIERRA_LEONE_REGIONS: SierraLeoneRegion[] = [
  {
    id: "eastern",
    name: "Eastern Region",
    code: "ER",
    districts: [
      { id: "kailahun", name: "Kailahun District", code: "KH" },
      { id: "kenema", name: "Kenema District", code: "KN" },
      { id: "kono", name: "Kono District", code: "KO" },
    ],
  },
  {
    id: "northern",
    name: "Northern Region",
    code: "NR",
    districts: [
      { id: "bombali", name: "Bombali District", code: "BM" },
      { id: "koinadugu", name: "Koinadugu District", code: "KD" },
      { id: "port_loko", name: "Port Loko District", code: "PL" },
      { id: "tonkolili", name: "Tonkolili District", code: "TN" },
      { id: "kambia", name: "Kambia District", code: "KB" },
    ],
  },
  {
    id: "southern",
    name: "Southern Region",
    code: "SR",
    districts: [
      { id: "bo", name: "Bo District", code: "BO" },
      { id: "bonthe", name: "Bonthe District", code: "BT" },
      { id: "moyamba", name: "Moyamba District", code: "MY" },
      { id: "pujehun", name: "Pujehun District", code: "PJ" },
    ],
  },
  {
    id: "western",
    name: "Western Region",
    code: "WR",
    districts: [
      { id: "western_urban", name: "Western Area Urban", code: "WU" },
      { id: "western_rural", name: "Western Area Rural", code: "WR" },
    ],
  },
]

export function getRegions() {
  return SIERRA_LEONE_REGIONS
}

export function getDistrictsByRegion(regionId: string) {
  const region = SIERRA_LEONE_REGIONS.find((r) => r.id === regionId)
  return region?.districts || []
}

export function getRegionName(regionId: string) {
  const region = SIERRA_LEONE_REGIONS.find((r) => r.id === regionId)
  return region?.name || regionId
}

export function getDistrictName(districtId: string) {
  for (const region of SIERRA_LEONE_REGIONS) {
    const district = region.districts.find((d) => d.id === districtId)
    if (district) return district.name
  }
  return districtId
}
