import { redirect } from "next/navigation";

// There is no home page: proxy.ts sends "/" to the right place (login, or the role's
// dashboard) before this ever renders. This is only the fallback if it somehow gets here.
export default function Home() {
  redirect("/login");
}
