import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** robots.txt 를 만들어 줍니다 — 검색엔진에게 "다 봐도 된다"고 알려주는 파일입니다 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
