import type { Metadata } from "next";
import TextPage, { Section } from "@/components/TextPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${SITE_NAME}이 어떤 정보를 다루는지, 광고와 쿠키가 어떻게 쓰이는지 안내합니다.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <TextPage title="개인정보처리방침" updatedAt="2026년 8월 3일">
      <Section title="한 줄 요약">
        <p>
          {SITE_NAME}은 회원가입이 없고, 이름·연락처 같은 개인정보를 직접 모으지 않습니다.
          다만 접속 기록과 광고를 위한 쿠키가 쓰일 수 있어 아래에 자세히 밝힙니다.
        </p>
      </Section>

      <Section title="수집하지 않는 것">
        <p>
          {SITE_NAME}은 회원가입, 로그인, 댓글 기능이 없습니다. 따라서 이름, 전화번호, 주소, 결제 정보 등
          어떤 개인정보도 직접 수집하거나 저장하지 않습니다.
        </p>
      </Section>

      <Section title="자동으로 남는 기록">
        <p>
          사이트에 접속하면 서비스 운영과 보안을 위해 접속 기록이 남을 수 있습니다. 여기에는 접속한 시각,
          방문한 주소, 브라우저 종류, IP 주소가 포함됩니다. 이 기록은 사이트가 제대로 돌아가는지 확인하고
          비정상적인 접속을 막는 데만 쓰이며, 특정 개인을 알아내기 위해 쓰지 않습니다.
        </p>
      </Section>

      <Section title="광고와 쿠키">
        <p>
          {SITE_NAME}은 운영 비용을 충당하기 위해 구글 애드센스를 통한 광고 게재를 준비하고 있습니다.
          광고가 게재되면 아래 내용이 적용됩니다.
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            구글을 포함한 제3자 광고 공급업체는 쿠키를 사용하여, 이용자가 이 사이트나 다른 사이트에 방문한 기록을
            바탕으로 광고를 게재합니다.
          </li>
          <li>
            구글이 광고 쿠키를 사용함으로써 이용자에게 맞춤 광고를 보여줄 수 있습니다.
          </li>
          <li>
            이용자는 구글 <strong className="font-bold text-foreground">광고 설정</strong>
            (adssettings.google.com)에서 맞춤 광고를 사용 중지할 수 있습니다.
          </li>
          <li>
            제3자 광고 공급업체의 쿠키 사용을 중지하려면 aboutads.info 에서 설정할 수 있습니다.
          </li>
          <li>
            브라우저 설정에서 쿠키를 직접 차단할 수도 있습니다. 쿠키를 차단해도 {SITE_NAME}의 목록과 검색은
            그대로 쓸 수 있습니다.
          </li>
        </ul>
      </Section>

      <Section title="다른 사이트로 나가는 링크">
        <p>
          {SITE_NAME}에는 각 AI 서비스의 공식 사이트로 이동하는 링크가 있습니다. 링크를 눌러 다른 사이트로
          이동하면 그때부터는 그 사이트의 개인정보처리방침이 적용됩니다. {SITE_NAME}은 다른 사이트에서 일어나는
          일에 대해 책임지지 않으므로, 해당 사이트의 방침을 따로 확인해주세요.
        </p>
      </Section>

      <Section title="어린이의 개인정보">
        <p>
          {SITE_NAME}은 만 14세 미만 어린이를 대상으로 하지 않으며, 어린이의 개인정보를 알면서 수집하지 않습니다.
        </p>
      </Section>

      <Section title="방침이 바뀔 때">
        <p>
          이 방침이 바뀌면 이 페이지에 바뀐 내용과 시행일을 올립니다. 중요한 변경이 있을 때는
          시행일을 앞당기지 않고 미리 알려드립니다.
        </p>
      </Section>

      <Section title="문의">
        <p>
          개인정보와 관련해 궁금한 점이 있으면 아래로 연락해주세요.
        </p>
        <p>
          운영자 {SITE_NAME} 운영자
          <br />
          이메일 <span className="font-bold text-foreground">{CONTACT_EMAIL}</span>
        </p>
      </Section>
    </TextPage>
  );
}
