export type AreaMlaMapping = {
  area: string;
  mla_name: string;
  constituency: string;
};

export const AREA_TO_MLA: AreaMlaMapping[] = [
  { area: "Gachibowli", mla_name: "Arekapudi Gandhi", constituency: "Serilingampally" },
  { area: "Miyapur", mla_name: "Arekapudi Gandhi", constituency: "Serilingampally" },
  { area: "Chandanagar", mla_name: "Arekapudi Gandhi", constituency: "Serilingampally" },
  { area: "Jubilee Hills", mla_name: "Maganti Gopinath", constituency: "Jubilee Hills" },
  { area: "Banjara Hills", mla_name: "Maganti Gopinath", constituency: "Jubilee Hills" },
  { area: "Film Nagar", mla_name: "Maganti Gopinath", constituency: "Jubilee Hills" },
  { area: "Khairatabad", mla_name: "Danam Nagender", constituency: "Khairatabad" },
  { area: "Somajiguda", mla_name: "Danam Nagender", constituency: "Khairatabad" },
  { area: "Lakdikapul", mla_name: "Danam Nagender", constituency: "Khairatabad" },
  { area: "Kukatpally", mla_name: "Madhavaram Krishna Rao", constituency: "Kukatpally" },
  { area: "Moosapet", mla_name: "Madhavaram Krishna Rao", constituency: "Kukatpally" },
  { area: "KPHB Colony", mla_name: "Madhavaram Krishna Rao", constituency: "Kukatpally" },
  { area: "Qutbullapur", mla_name: "K.P. Vivekananda", constituency: "Qutbullapur" },
  { area: "Jeedimetla", mla_name: "K.P. Vivekananda", constituency: "Qutbullapur" },
  { area: "Suchitra", mla_name: "K.P. Vivekananda", constituency: "Qutbullapur" },
  { area: "Uppal", mla_name: "Bandari Lakshma Reddy", constituency: "Uppal" },
  { area: "Nacharam", mla_name: "Bandari Lakshma Reddy", constituency: "Uppal" },
  { area: "Habsiguda", mla_name: "Bandari Lakshma Reddy", constituency: "Uppal" },
  { area: "L.B. Nagar", mla_name: "D. Sudheer Reddy", constituency: "Lal Bahadur Nagar" },
  { area: "Saroornagar", mla_name: "D. Sudheer Reddy", constituency: "Lal Bahadur Nagar" },
  { area: "Vanasthalipuram", mla_name: "D. Sudheer Reddy", constituency: "Lal Bahadur Nagar" },
  { area: "Amberpet", mla_name: "Kaleru Venkatesham", constituency: "Amberpet" },
  { area: "Golnaka", mla_name: "Kaleru Venkatesham", constituency: "Amberpet" },
  { area: "Ramanthapur", mla_name: "Kaleru Venkatesham", constituency: "Amberpet" },
  { area: "Musheerabad", mla_name: "Muta Gopal", constituency: "Musheerabad" },
  { area: "Chikkadpally", mla_name: "Muta Gopal", constituency: "Musheerabad" },
  { area: "Domalguda", mla_name: "Muta Gopal", constituency: "Musheerabad" },
  { area: "Malakpet", mla_name: "Ahmed Balala", constituency: "Malakpet" },
  { area: "Dilsukhnagar", mla_name: "Ahmed Balala", constituency: "Malakpet" },
  { area: "Moosarambagh", mla_name: "Ahmed Balala", constituency: "Malakpet" },
  { area: "Charminar", mla_name: "Mir Zulfeqar Ali", constituency: "Charminar" },
  { area: "Falaknuma", mla_name: "Mohammed Moazam Khan", constituency: "Bahadurpura" },
  { area: "Yakutpura", mla_name: "Jaffar Hussain", constituency: "Yakutpura" },
  { area: "Nampally", mla_name: "Mohammed Majid Hussain", constituency: "Nampally" },
  { area: "Karwan", mla_name: "Kausar Mohiuddin", constituency: "Karwan" },
  { area: "Secunderabad", mla_name: "T. Padma Rao Goud", constituency: "Secunderabad" },
  { area: "Sanathnagar", mla_name: "Talasani Srinivas Yadav", constituency: "Sanathnagar" },
  { area: "Medchal", mla_name: "Chamakura Malla Reddy", constituency: "Medchal" },
  { area: "Patancheru", mla_name: "Gudem Mahipal Reddy", constituency: "Patancheru" },
  { area: "Maheshwaram", mla_name: "Sabitha Indra Reddy", constituency: "Maheshwaram" },
];

function normalizeArea(area: string) {
  return area.trim().toLowerCase();
}

export function lookupMlaByArea(area: string): { mla_name: string; constituency: string } | null {
  const normalized = normalizeArea(area);
  const match = AREA_TO_MLA.find((x) => normalizeArea(x.area) === normalized);
  if (!match) return null;
  return { mla_name: match.mla_name, constituency: match.constituency };
}
