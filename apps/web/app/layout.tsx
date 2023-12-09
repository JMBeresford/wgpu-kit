import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import Link from "next/link";
import { Header, HeaderTitle } from "ui/header";
import { FaExternalLinkAlt } from "react-icons/fa";
import { Nav } from "ui/nav";
import "./main.scss";
import { Button } from "ui/button";

const iconProps = {
  size: "0.7em",
  style: { verticalAlign: "top", marginLeft: "0.25em", opacity: 0.5 },
};

export default function Layout(props: { children: ReactNode }): JSX.Element {
  return (
    <html className={GeistSans.className} lang="en">
      <body>
        <div id="root">
          <Header id="root-header">
            <HeaderTitle>
              <Link href="/"> WGPU-Kit </Link>
            </HeaderTitle>
            <Nav>
              <a
                href="https://jmberesford.github.io/wgpu-kit/"
                rel="noopener"
                target="_blank"
              >
                API
                <FaExternalLinkAlt {...iconProps} />
              </a>

              <a
                href="https://github.com/JMBeresford/wgpu-kit"
                rel="noopener"
                target="_blank"
              >
                Source
                <FaExternalLinkAlt {...iconProps} />
              </a>

              <Link href="/examples">
                <Button
                  primary
                  small
                  style={{ fontSize: "inherit", fontWeight: "inherit" }}
                >
                  Examples
                </Button>
              </Link>
            </Nav>
          </Header>

          <div id="content">{props.children}</div>
        </div>
      </body>
    </html>
  );
}
