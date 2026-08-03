import type { Metadata } from "next";
import Link from "next/link";
import TextPage, { Section } from "@/components/TextPage";
import { CATEGORIES } from "@/lib/services";

export const metadata: Metadata = {
  title: "소개",
  description: "AI.ZIP이 어떤 사이트인지, 어떤 기준으로 AI 서비스를 고르고 정리하는지 알려드립니다.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <TextPage title="AI.ZIP 소개">
      <Section title="어떤 사이트인가요">
        <p>
          AI.ZIP은 한국어로 쓸 수 있는 AI 서비스를 모아 한곳에서 비교할 수 있게 만든 목록 사이트입니다.
          전문 지식이 없어도 &ldquo;내가 지금 필요한 AI가 뭔지&rdquo;를 몇 초 안에 찾는 것을 목표로 합니다.
        </p>
        <p>
          AI 서비스는 하루가 다르게 쏟아지지만, 대부분의 소개 글은 영어로 되어 있거나 기능을 길게 나열하기만 합니다.
          정작 알고 싶은 것은 &ldquo;이게 나한테 필요한가, 무료로 어디까지 되나, 한국어가 되나&rdquo; 세 가지인데
          그걸 확인하려면 사이트를 하나하나 들어가 봐야 합니다. AI.ZIP은 그 세 가지를 목록에서 바로 보이게 정리합니다.
        </p>
      </Section>

      <Section title="어떻게 고르나요">
        <p>
          국내외에서 새로 나온 AI 서비스를 정기적으로 모은 뒤, 아래 기준으로 거르고 사람이 한 번 더 확인해서 싣습니다.
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>일반 사용자가 지금 바로 가입해서 쓸 수 있는 서비스만 싣습니다.</li>
          <li>출시 예정이거나 대기명단만 받고 있는 서비스는 싣지 않습니다.</li>
          <li>
            개발자용 코드 라이브러리, 프로그래밍 언어, 프레임워크처럼 AI가 본체가 아닌 도구는 제외합니다.
          </li>
          <li>규모는 보지 않습니다. 1인 개발 서비스라도 실제로 쓸 수 있으면 대기업 서비스와 똑같이 다룹니다.</li>
        </ul>
      </Section>

      <Section title="분야">
        <p>모든 서비스는 아래 다섯 가지 중 하나로 나눕니다. 목록 위쪽에서 눌러 걸러볼 수 있습니다.</p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {CATEGORIES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p>
          최근 24시간 안에 새로 올라온 서비스는 <strong className="font-bold text-foreground">오늘 새롭게 추가된 AI</strong>로
          따로 모아둡니다.
        </p>
      </Section>

      <Section title="꼭 알아두실 점">
        <p>
          AI.ZIP은 어떤 서비스도 직접 운영하지 않습니다. 소개하는 서비스는 모두 각 회사가 만들고 운영하며,
          AI.ZIP은 어떤 대가도 받지 않고 목록에 싣습니다. 돈을 받고 순서를 올려주거나 특정 서비스를 밀어주지 않습니다.
        </p>
        <p>
          가격과 기능은 서비스 쪽 사정으로 자주 바뀝니다. AI.ZIP에 적힌 내용은 정리한 시점의 정보이므로,
          결제 전에는 반드시 해당 서비스의 공식 사이트에서 다시 확인해주세요.
        </p>
      </Section>

      <Section title="잘못된 정보를 발견하셨다면">
        <p>
          내용이 틀렸거나, 서비스가 문을 닫았거나, 목록에 넣고 싶은 서비스가 있으면 알려주세요.
          확인하고 고치겠습니다. <Link href="/contact" className="font-bold text-foreground underline">문의</Link> 페이지에
          연락처가 있습니다.
        </p>
      </Section>
    </TextPage>
  );
}
