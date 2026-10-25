import { createSSRApp } from "vue";
import { renderToString } from "@vue/server-renderer";
import { expect, it, vi } from "vitest";
import LoginView from "./LoginView.vue";

vi.mock("vue-router", () => ({ useRoute: () => ({ query: {} }), useRouter: () => ({ replace: vi.fn() }) }));

it("initially disables unchecked social providers and keeps email login available", async () => {
  const html = await renderToString(createSSRApp(LoginView));
  expect(html.match(/<button[^>]*disabled[^>]*>\s*(?:Google|GitHub)로 계속하기/g)).toHaveLength(2);
  expect(html).toContain("이메일로 가입하거나 로그인해 주세요.");
  expect(html).toMatch(/<button type="submit" class="primary">로그인<\/button>/);
});
