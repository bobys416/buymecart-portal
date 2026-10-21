import { redirect, notFound } from "next/navigation";

const validPortals = [
  "admin",
  "super-distributor",
  "area-distributor",
  "retailer",
  "distributor",
] as const;

export default async function PortalIndexPage({
  params,
}: {
  params: Promise<{ portal: string }>;
}) {
  const { portal } = await params;
  if (!validPortals.includes(portal as (typeof validPortals)[number])) {
    notFound();
  }

  redirect(`/${portal}/dashboard`);
}

