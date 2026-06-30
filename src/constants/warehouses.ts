/**
 * Liberty & Liberty Logistics receiving hubs. Customers ship their online
 * purchases to one of these addresses (with their personal suite/ref derived
 * from their customer code) and we forward the parcel onward.
 */
export interface WarehouseHub {
  key: string;
  name: string;
  flag: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  phone: string;
  /** True for the main package-forwarding intake hub. */
  primary?: boolean;
}

export const WAREHOUSES: WarehouseHub[] = [
  {
    key: "usa-houston",
    name: "Houston Hub",
    flag: "🇺🇸",
    line1: "1200 Logistics Way",
    city: "Houston",
    region: "TX",
    postal: "77001",
    country: "United States",
    phone: "+1 (800) 526-5555",
    primary: true,
  },
  {
    key: "usa-newark",
    name: "New Jersey Hub",
    flag: "🇺🇸",
    line1: "85 Port Street, Unit 4",
    city: "Newark",
    region: "NJ",
    postal: "07114",
    country: "United States",
    phone: "+1 (973) 555-0142",
  },
  {
    key: "usa-atlanta",
    name: "Atlanta Hub",
    flag: "🇺🇸",
    line1: "2400 Cargo Parkway",
    city: "Atlanta",
    region: "GA",
    postal: "30320",
    country: "United States",
    phone: "+1 (404) 555-0188",
  },
  {
    key: "ghana-tema",
    name: "Tema Hub",
    flag: "🇬🇭",
    line1: "24 Harbour Road",
    city: "Tema",
    region: "Greater Accra",
    postal: "00233",
    country: "Ghana",
    phone: "+233 30 000 0000",
  },
  {
    key: "ghana-kumasi",
    name: "Kumasi Hub",
    flag: "🇬🇭",
    line1: "12 Adum High Street",
    city: "Kumasi",
    region: "Ashanti",
    postal: "00233",
    country: "Ghana",
    phone: "+233 32 000 0000",
  },
  {
    key: "china-guangzhou",
    name: "Guangzhou Hub",
    flag: "🇨🇳",
    line1: "88 Baiyun Logistics Park",
    city: "Guangzhou",
    region: "Guangdong",
    postal: "510000",
    country: "China",
    phone: "+86 20 0000 0000",
  },
  {
    key: "uk-london",
    name: "London Hub",
    flag: "🇬🇧",
    line1: "8 Gateway Estate",
    city: "London",
    region: "England",
    postal: "UB3 5AN",
    country: "United Kingdom",
    phone: "+44 20 7946 0000",
  },
];

export function getWarehouse(key: string): WarehouseHub | undefined {
  return WAREHOUSES.find((w) => w.key === key);
}

/**
 * The personal suite/reference a customer must add to the address so the hub
 * can match an inbound parcel to them. Derived from their customer code — no
 * extra data to store.
 */
export function customerSuite(customerCode: string | undefined | null): string {
  const code = (customerCode ?? "").trim();
  return code ? `Suite ${code}` : "Suite (your customer code)";
}

/** Full, copy-pasteable address block for a hub + customer. */
export function warehouseAddressLines(
  hub: WarehouseHub,
  customerName: string,
  customerCode: string | undefined | null,
): string[] {
  return [
    customerName,
    "Liberty & Liberty Logistics",
    customerSuite(customerCode),
    hub.line1,
    `${hub.city}, ${hub.region} ${hub.postal}`,
    hub.country,
  ];
}
