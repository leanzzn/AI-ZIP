import type { Metadata } from "next";
import TextPage, { Section } from "@/components/TextPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "문의",
  description: `${SITE_NAME}에 서비스 등록을 요청하거나, 잘못된 정보를 알려주실 때 쓰는 연락처입니다.`,
  alternates: { canonical: "/contact" },
};

/** 어떤 문의를 받는지 미리 적어두면 사장님이 받는 메일이 정리됩니다 */
const 문의종류 = [
  {
    title: "서비스를 목록에 넣어주세요",
    body: "직접 만드신 AI 서비스나, 좋은데 아직 안 실린 서비스를 알려주세요. 서비스 이름과 사이트 주소만 있으면 됩니다.",
  },
  {
    title: "정보가 잘못됐어요",
    body: "가격이 바뀌었거나, 한국어 지원 여부가 틀렸거나, 서비스가 문을 닫았다면 알려주세요. 확인하고 고치겠습니다.",
  },
  {
    title: "내 서비스를 내려주세요",
    body: "운영하시는 서비스가 실려 있고 원하지 않으시면 말씀해주세요. 확인 후 바로 내리겠습니다.",
  },
  {
    title: "그 밖의 문의",
    body: "제안, 오류 신고, 그 외 어떤 이야기든 좋습니다.",
  },
];

export default function ContactPage() {
  return (
    <TextPage title="문의">
      <Section title="연락처">
        <p>
          아래 이메일로 보내주세요. 확인하는 대로 답장드리며, 보통 며칠 안에 답을 드립니다.
        </p>
        <p className="text-lg font-bold text-foreground">
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>운영자 {SITE_NAME} 운영자</p>
      </Section>

      <Section title="이런 문의를 받습니다">
        <div className="flex flex-col gap-5">
          {문의종류.map((q) => (
            <div key={q.title}>
              <p className="font-bold text-foreground">{q.title}</p>
              <p className="mt-1">{q.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="답변이 어려운 문의">
        <p>
          {SITE_NAME}은 소개하는 AI 서비스를 직접 운영하지 않습니다. 특정 서비스의 결제, 환불, 계정, 오류에 관한
          문의는 저희가 도와드릴 수 없으니 해당 서비스의 고객센터로 연락해주세요.
        </p>
        <p>
          목록에 실어드리는 대가로 광고비를 받지 않기 때문에, 유료 게재나 순위 상승 제안에는 답변드리지 않습니다.
        </p>
      </Section>
    </TextPage>
  );
}
