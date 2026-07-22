import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

/**
 * /about — zero-knowledge architecture explainer.
 *
 * One-pass is a fork of jhaals/yopass. The page exists to prove to non-expert
 * users (customers, PMs, ops) that the server cannot see their plaintext.
 * Every claim links to evidence (RFC, server source path, F12 instructions).
 */
export default function About() {
  const { t } = useTranslation();
  return (
    <article className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-bold mb-2">{t('about.pageTitle')}</h1>
      <p className="text-base-content/70 text-lg mb-6">{t('about.tagline')}</p>

      {/* Comparison: insecure vs one-pass */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div
          className="rounded-lg p-4"
          style={{ border: '2px solid #EF4444', background: '#FEF2F2' }}
        >
          <h3 className="font-semibold text-base mt-0" style={{ color: '#B91C1C' }}>
            ❌ {t('about.insecureTitle')}
          </h3>
          <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed mt-2 mb-2">
{t('about.insecureFlow')}
          </pre>
          <p className="text-sm" style={{ color: '#B91C1C' }}>
            {t('about.insecureRisk')}
          </p>
        </div>
        <div
          className="rounded-lg p-4"
          style={{ border: '2px solid #7DD3C0', background: '#F0FDF4' }}
        >
          <h3 className="font-semibold text-base mt-0" style={{ color: '#15803D' }}>
            ✅ {t('about.secureTitle')}
          </h3>
          <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed mt-2 mb-2">
{t('about.secureFlow')}
          </pre>
          <p className="text-sm" style={{ color: '#15803D' }}>
            {t('about.secureRisk')}
          </p>
        </div>
      </section>

      {/* Data flow diagram */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3">{t('about.dataFlowTitle')}</h2>
        <pre className="rounded-lg bg-base-200/70 border border-base-300 p-4 text-xs overflow-auto font-mono leading-relaxed">
{`  ${t('about.diagram.you')}
  ┌─────────────────────┐                       ┌─────────────────────┐
  │  ${t('about.diagram.plaintext')}            │                       │  ${t('about.diagram.ciphertext')}  │
  │       ↓             │                       │         ↑           │
  │  ${t('about.diagram.encrypt')}     │   ${t('about.diagram.ciphertextOnly')}     │  ${t('about.diagram.store')}        │
  │       ↓             │     (HTTPS)            │                     │
  │  ${t('about.diagram.ciphertext')}  │  ───────────────────────▶ │  ${t('about.diagram.cantRead')}     │
  │       ↑             │                       │  ${t('about.diagram.noKey')}        │
  │  ${t('about.diagram.key')}         │                       │                     │
  │  (${t('about.diagram.local')})  │                       │                     │
  └─────────────────────┘                       └─────────────────────┘
                                                       ${t('about.diagram.server')}`}
        </pre>
      </section>

      {/* Hard evidence */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3">{t('about.evidenceTitle')}</h2>
        <ol className="list-decimal pl-6 space-y-2 text-base">
          <li>
            <strong>{t('about.evidence1Title')}：</strong>
            {t('about.evidence1Body')}{' '}
            <a
              href="https://datatracker.ietf.org/doc/html/rfc3986#section-3.5"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              RFC 3986 §3.5
            </a>
          </li>
          <li>
            <strong>{t('about.evidence2Title')}：</strong>
            {t('about.evidence2Body')}
          </li>
          <li>
            <strong>{t('about.evidence3Title')}：</strong>
            {t('about.evidence3Body')}
          </li>
          <li>
            <strong>{t('about.evidence4Title')}：</strong>
            {t('about.evidence4Body')}
          </li>
        </ol>
      </section>

      {/* Residual risks — honesty */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3">{t('about.riskTitle')}</h2>
        <ul className="list-disc pl-6 space-y-2 text-base">
          <li>{t('about.risk1')}</li>
          <li>{t('about.risk2')}</li>
          <li>{t('about.risk3')}</li>
        </ul>
      </section>

      {/* Promises */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3">{t('about.promiseTitle')}</h2>
        <ul className="list-disc pl-6 space-y-2 text-base">
          <li>{t('about.promise1')}</li>
          <li>{t('about.promise2')}</li>
          <li>{t('about.promise3')}</li>
          <li>
            {t('about.promise4')}{' '}
            <a
              href="https://git.dbhys.com/ohoooho/one-pass"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              git.dbhys.com/ohoooho/one-pass
            </a>
            （{t('about.apacheLicense')}）
          </li>
        </ul>
      </section>

      <div className="text-center mt-10">
        <Link
          to="/"
          className="btn btn-primary px-8 py-3 text-base font-semibold"
        >
          ← {t('about.backHome')}
        </Link>
      </div>
    </article>
  );
}
