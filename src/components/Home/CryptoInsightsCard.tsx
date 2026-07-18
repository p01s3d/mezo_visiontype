import { HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';
import type { Protocol } from '../../api/defillama';

type CryptoInsightsCardProps = {
  insight: string;
  highlight?: string;
  trending: Protocol[];
};

function SparkleIcon() {
  return (
    <svg aria-hidden height="14" viewBox="0 0 14 14" width="14">
      <path
        d="M7 1.5L7.9 5.1L11.5 6L7.9 6.9L7 10.5L6.1 6.9L2.5 6L6.1 5.1L7 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function renderInsight(text: string, highlight?: string) {
  if (!highlight || !text.toLowerCase().includes(highlight.toLowerCase())) {
    return text;
  }
  const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
  const before = text.slice(0, idx);
  const mid = text.slice(idx, idx + highlight.length);
  const after = text.slice(idx + highlight.length);
  return (
    <>
      {before}
      <Text color="fg" font="label2">
        {mid}
      </Text>
      {after}
    </>
  );
}

function chipInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function CryptoInsightsCard({ insight, highlight, trending }: CryptoInsightsCardProps) {
  return (
    <section className="healthBento__card healthBento__card--insights">
      <HStack alignItems="center" justifyContent="space-between" width="100%">
        <HStack alignItems="center" gap={1}>
          <span className="healthBento__sparkle" aria-hidden>
            <SparkleIcon />
          </span>
          <Text font="label1">Crypto Insights</Text>
        </HStack>
      </HStack>

      <VStack gap={2} paddingTop={1.5}>
        <Text color="fgMuted" font="label2">
          {renderInsight(insight, highlight)}
        </Text>

        {trending.length > 0 ? (
          <div className="healthBento__insightChips">
            {trending.map((p) => (
              <span
                className="healthBento__insightChip"
                key={p.id}
                title={`${p.name} ${p.change1d != null ? `${p.change1d > 0 ? '+' : ''}${p.change1d.toFixed(1)}% 1d` : ''}`}
              >
                {p.logo ? (
                  <img alt="" className="healthBento__insightChipImg" src={p.logo} />
                ) : (
                  <Text font="caption">{chipInitials(p.name)}</Text>
                )}
              </span>
            ))}
          </div>
        ) : null}
      </VStack>
    </section>
  );
}
