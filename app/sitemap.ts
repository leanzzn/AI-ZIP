import type { MetadataRoute } from "next";
import { getServices } from "@/lib/services";
import { SITE_URL } from "@/lib/site";

// 노션에 툴이 새로 쌓이면 사이트맵에도 바로 반영되게 (목록과 같은 1시간 캐시를 씁니다)
export const dynamic = "force-dynamic";

/**
 * sitemap.xml — 검색엔진에게 "우리 사이트에 이런 페이지들이 있다"고 알려주는 목록입니다.
 *
 * 소개글이 빈 서비스는 일부러 넣지 않습니다. 상세페이지가 이름·태그·버튼만 남아
 * 애드센스가 말하는 "콘텐츠가 거의 없는 페이지"가 되기 때문입니다.
 * 노션에서 소개글을 채우면 그때 자동으로 목록에 들어옵니다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const 고정페이지: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const services = await getServices().catch(() => []);
  const 상세페이지: MetadataRoute.Sitemap = services
    .filter((s) => s.overview)
    .map((s) => ({
      url: `${SITE_URL}/service/${s.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...고정페이지, ...상세페이지];
}
