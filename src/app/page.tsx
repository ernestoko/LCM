import { redirect } from "next/navigation";

/** Entry point — the layout/guard handles routing to login or setup. */
export default function Home() {
  redirect("/dashboard");
}
