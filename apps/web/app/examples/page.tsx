import Link from "next/link";
import { Examples } from "../../examples";
import styles from "./styles.module.scss";

export default function Page(): JSX.Element {
  return (
    <main className={styles.main}>
      <h1>Examples</h1>

      <div className={styles.examples}>
        {Examples.map((example) => (
          <Link href={`/examples/${example.url}`} key={example.title}>
            <div className={styles.example}>
              <h2>{example.title}</h2>
              <p>{example.description}</p>
            </div>
            <hr />
          </Link>
        ))}
      </div>
    </main>
  );
}
