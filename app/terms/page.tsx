import type { Metadata } from "next";
import TextPage, { Section } from "@/components/TextPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "이용약관",
  description: `${SITE_NAME}을 이용하실 때 알아두셔야 할 내용을 정리했습니다.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <TextPage title="이용약관" updatedAt="2026년 8월 3일">
      <Section title="이 사이트의 성격">
        <p>
          {SITE_NAME}은 AI 서비스를 소개하는 정보 제공 사이트입니다. 회원가입 없이 누구나 무료로 볼 수 있고,
          {SITE_NAME}이 직접 AI 서비스를 만들거나 판매하지 않습니다.
        </p>
      </Section>

      <Section title="소개하는 서비스에 대하여">
        <p>
          {SITE_NAME}에 실린 AI 서비스는 모두 제3자가 운영합니다. 각 서비스의 가입, 결제, 환불, 개인정보 처리,
          서비스 품질에 관한 책임은 해당 서비스를 운영하는 회사에 있으며 {SITE_NAME}은 관여하지 않습니다.
        </p>
        <p>
          {SITE_NAME}에 적힌 가격, 무료 사용 범위, 한국어 지원 여부는 정리한 시점의 정보입니다. 서비스 쪽 사정으로
          예고 없이 바뀔 수 있으므로 <strong className="font-bold text-foreground">결제 전에는 반드시 해당 서비스의
          공식 사이트에서 다시 확인</strong>해주세요. 정보가 달라져서 생긴 손해에 대해 {SITE_NAME}은 책임지지 않습니다.
        </p>
      </Section>

      <Section title="게재 기준과 대가">
        <p>
          {SITE_NAME}은 목록에 싣는 대가로 어떤 금전도 받지 않습니다. 돈을 받고 순위를 올려주거나 특정 서비스를
          유리하게 소개하지 않습니다. 게재 여부와 순서는 운영자가 정한 기준에 따라서만 정합니다.
        </p>
      </Section>

      <Section title="저작권">
        <p>
          {SITE_NAME}이 직접 작성한 소개 글과 화면 구성의 권리는 {SITE_NAME}에 있습니다.
          각 서비스의 이름, 상표, 로고는 해당 권리자의 것이며, 서비스를 알아볼 수 있게 하기 위한 목적으로만 씁니다.
        </p>
        <p>
          {SITE_NAME}의 글을 인용하실 때는 출처와 함께 링크를 걸어주세요. 목록 전체를 그대로 복사해 다른 곳에
          올리는 것은 삼가주시기 바랍니다.
        </p>
      </Section>

      <Section title="게재 중단 요청">
        <p>
          자신이 운영하는 서비스가 {SITE_NAME}에 실려 있고 이를 원하지 않으시면 알려주세요. 확인 후 내리겠습니다.
          잘못된 정보에 대한 수정 요청도 같은 방법으로 받습니다.
        </p>
      </Section>

      <Section title="약관이 바뀔 때">
        <p>
          이 약관이 바뀌면 이 페이지에 바뀐 내용과 시행일을 올립니다. 문의는{" "}
          <span className="font-bold text-foreground">{CONTACT_EMAIL}</span>로 보내주세요.
        </p>
      </Section>
    </TextPage>
  );
}
