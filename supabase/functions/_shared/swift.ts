export type SwiftProduct = {
  name?: string;
  network?: string;
  data_volume_mb?: number | null;
  swift_package_id?: string | null;
};

export type SwiftPlan = {
  package_id: string;
  network: string;
  package_size: string;
};

export function normalizePackageSize(dataVolumeMb: number | null | undefined) {
  if (!dataVolumeMb) return null;
  if (dataVolumeMb % 1024 === 0) return `${dataVolumeMb / 1024}GB`;
  return `${dataVolumeMb}MB`;
}

export function primarySwiftNetworks(network: string | undefined) {
  const value = network?.toLowerCase();
  // SwiftData network codes: YELLO = MTN, RED = Telecel, BLUE = AirtelTigo
  if (value === "mtn") return ["YELLO", "MTN"];
  if (value === "telecel") return ["RED", "TELECEL", "VODAFONE"];
  if (value === "airteltigo") return ["BLUE", "AT", "AIRTELTIGO"];
  return [];
}

export function inferPackageIdFromProduct(product: SwiftProduct) {
  const packageSize = normalizePackageSize(product.data_volume_mb ?? null);
  if (!packageSize?.endsWith("GB")) return null;

  const gb = packageSize.slice(0, -2).toLowerCase();
  const network = product.network?.toLowerCase();
  if (network === "mtn") return `yellow_${gb}gb`;
  if (network === "telecel") return `red_${gb}gb`;
  if (network === "airteltigo") return `blue_${gb}gb`;
  return null;
}

function planMatchesProductNetwork(plan: SwiftPlan, productNetwork: string | undefined) {
  return primarySwiftNetworks(productNetwork).includes(plan.network);
}

export async function fetchSwiftPlans(swiftApiUrl: string, apiKey: string) {
  try {
    const url = new URL(swiftApiUrl);
    if (url.pathname.endsWith("/payment/data")) {
      url.pathname = url.pathname.replace(/\/payment\/data$/, "/plans");
    } else {
      url.pathname = url.pathname.replace(/\/$/, "") + "/plans";
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const body = await response.json();
    return Array.isArray(body?.plans) ? (body.plans as SwiftPlan[]) : [];
  } catch {
    return [];
  }
}

export function resolveSwiftPackageIdFromPlans(
  swiftPackageId: string | null | undefined,
  product: SwiftProduct,
  plans: SwiftPlan[]
) {
  if (swiftPackageId) {
    const exactMatch = plans.find((plan) => plan.package_id === swiftPackageId);
    if (exactMatch && planMatchesProductNetwork(exactMatch, product.network)) {
      return swiftPackageId;
    }
  }

  const inferredId = inferPackageIdFromProduct(product);
  if (inferredId) {
    const inferredMatch = plans.find((plan) => plan.package_id === inferredId);
    if (inferredMatch) return inferredId;
  }

  const packageSize = normalizePackageSize(product.data_volume_mb ?? null);
  if (!packageSize) return null;

  const allowedNetworks = primarySwiftNetworks(product.network);
  const candidates = plans.filter(
    (plan) => plan.package_size === packageSize && allowedNetworks.includes(plan.network)
  );

  return candidates.length ? candidates[0].package_id : null;
}

export async function resolveSwiftPackageId(
  swiftPackageId: string | null | undefined,
  product: SwiftProduct,
  swiftApiUrl: string,
  apiKey: string
) {
  const plans = await fetchSwiftPlans(swiftApiUrl, apiKey);
  return resolveSwiftPackageIdFromPlans(swiftPackageId, product, plans);
}
