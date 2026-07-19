import { useEffect, useMemo, useState } from 'react';
import { Button } from '@coinbase/cds-web/buttons';
import { Chip } from '@coinbase/cds-web/chips';
import { SelectOption } from '@coinbase/cds-web/controls';
import { Dropdown } from '@coinbase/cds-web/dropdown';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Pressable } from '@coinbase/cds-web/system';
import { SegmentedTabs } from '@coinbase/cds-web/tabs';
import { Text } from '@coinbase/cds-web/typography';
import { Icon } from '@coinbase/cds-web/icons';
import { useConnection } from 'wagmi';
import { useTradeIntent, type TradeTab } from '../../hooks/useTradeIntent';
import { AssetSelectorList } from './AssetSelectorList';

type OrderType = 'one-time' | 'recurring';

const TRADE_TABS = [
  { id: 'buy' as const, label: 'Buy' },
  { id: 'sell' as const, label: 'Sell' },
  { id: 'convert' as const, label: 'Convert' },
];

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: 'one-time', label: 'One-time order' },
  { value: 'recurring', label: 'Recurring buy' },
];

const BRAND_CORAL = 'var(--color-fgPrimary, #cc785c)';

export const TradePanel = ({ bleedX = 3 }: { bleedX?: 0 | 3 }) => {
  const { intent } = useTradeIntent();
  const [activeTab, setActiveTab] = useState<TradeTab>('buy');
  const [orderType, setOrderType] = useState<OrderType>('one-time');
  const [amount, setAmount] = useState('');
  const [assetSymbol, setAssetSymbol] = useState('BTC');
  const [assetLabel, setAssetLabel] = useState('Bitcoin');
  const { isConnected } = useConnection();

  useEffect(() => {
    if (!intent) return;
    setActiveTab(intent.tab);
    setAssetSymbol(intent.assetSymbol);
    setAssetLabel(intent.assetLabel);
    setAmount('');
  }, [intent]);

  const activeTabValue = useMemo(
    () => TRADE_TABS.find((tab) => tab.id === activeTab) ?? TRADE_TABS[0],
    [activeTab],
  );
  const orderTypeLabel =
    ORDER_TYPES.find((option) => option.value === orderType)?.label ?? 'One-time order';

  const assetActionLabel =
    activeTab === 'sell' ? 'Sell' : activeTab === 'convert' ? 'Convert' : 'Buy';
  const convertedAmount = amount ? (Number(amount) / 65000).toFixed(8).replace(/\.?0+$/, '') : '0';

  const primaryLabel = isConnected
    ? activeTab === 'buy'
      ? 'Review buy'
      : activeTab === 'sell'
        ? 'Review sell'
        : 'Review conversion'
    : 'Top up USD wallet';

  return (
    <VStack gap={3} width="100%">
      <Box width="100%">
        <SegmentedTabs
          activeTab={activeTabValue}
          onChange={(tab) => tab && setActiveTab(tab.id)}
          tabs={TRADE_TABS}
        />
      </Box>

      <Dropdown
        content={
          <VStack>
            {ORDER_TYPES.map((option) => (
              <SelectOption
                key={option.value}
                onClick={() => setOrderType(option.value)}
                title={option.label}
                value={option.value}
              />
            ))}
          </VStack>
        }
        onChange={(value: string) => setOrderType(value as OrderType)}
        value={orderType}
        width={220}
      >
        <Pressable
          alignSelf="flex-start"
          background="bgAlternate"
          borderRadius={1000}
          paddingX={2}
          paddingY={1}
        >
          <HStack alignItems="center" gap={1}>
            <Text font="headline">{orderTypeLabel}</Text>
            <Icon active color="fg" name="caretDown" size="s" />
          </HStack>
        </Pressable>
      </Dropdown>

      <VStack gap={1} width="100%">
        <HStack alignItems="center" justifyContent="space-between" width="100%">
          <HStack alignItems="baseline" flexGrow={1} gap={1} minWidth={0}>
            <Box
              as="input"
              inputMode="decimal"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setAmount(event.target.value.replace(/[^\d.]/g, ''))
              }
              placeholder="0"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                fontFamily: 'var(--defaultFont-sans)',
                fontSize: '3rem',
                fontWeight: 400,
                lineHeight: 1.1,
                minWidth: '1ch',
                outline: 'none',
                padding: 0,
                width: `${Math.max((amount || '0').length, 1)}ch`,
              }}
              value={amount}
            />
            <Text color="fgMuted" font="display2">
              USD
            </Text>
          </HStack>
          <Chip background="bgAlternate" compact onClick={() => setAmount('100')}>
            Max
          </Chip>
        </HStack>

        <HStack alignItems="center" gap={1}>
          <Icon active name="sortDoubleArrow" size="s" style={{ color: BRAND_CORAL }} />
          <Text font="label2" style={{ color: BRAND_CORAL }}>
            {convertedAmount} {assetSymbol}
          </Text>
        </HStack>
      </VStack>

      <AssetSelectorList
        assetActionLabel={assetActionLabel}
        assetSubtitle={assetLabel}
        assetSymbol={assetSymbol}
        bleedX={bleedX}
        payWithLabel="Pay with"
        payWithSubtitle="USD Wallet"
      />

      <Button alignSelf="stretch" borderRadius={200} variant="primary">
        {primaryLabel}
      </Button>
    </VStack>
  );
};
