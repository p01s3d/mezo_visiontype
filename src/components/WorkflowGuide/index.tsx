import { Box, Divider, VStack } from '@coinbase/cds-web/layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@coinbase/cds-web/tables';
import { Text } from '@coinbase/cds-web/typography';
import { GuideDeepDive } from './GuideDeepDive';
import {
  COMPONENT_MAP,
  DEEP_DIVE_CHAPTERS,
  HERO,
  STACK_ROWS,
  type DeepDiveChapter,
} from './guideContent';
import { GuideBand, GuideHero, GuideSectionHeader } from './GuideLayout';
import { GuidePreview } from './previews';

function chapterPreviews(previewKey: DeepDiveChapter['previewKey']) {
  const keys = Array.isArray(previewKey) ? previewKey : [previewKey];
  return keys.map((key) => <GuidePreview key={key} previewKey={key} />);
}

const MONO = 'var(--defaultFont-mono)';

function AppendixTable({
  columns,
  rows,
}: {
  columns: [string, string, string];
  rows: { key: string; a: string; b: string; c: string }[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableCell key={col}>
              <Text font="label2">{col}</Text>
            </TableCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell>
              <Text font="headline">{row.a}</Text>
            </TableCell>
            <TableCell>
              <Text color="fgMuted" font="label2" style={{ fontFamily: MONO }}>
                {row.b}
              </Text>
            </TableCell>
            <TableCell>
              <Text font="label2">{row.c}</Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const WorkflowGuide = () => {
  const chapterTotal = DEEP_DIVE_CHAPTERS.length;

  return (
    <VStack gap={0} width="100%">
      <GuideHero subtitle={HERO.subtitle} title={HERO.title} />

      <Divider />

      {DEEP_DIVE_CHAPTERS.map((chapter, index) => (
        <Box key={chapter.id} width="100%">
          {index > 0 ? <Divider /> : null}
          <GuideBand paddingY={6}>
            <GuideDeepDive
              body={chapter.body}
              chapterIndex={index + 1}
              chapterTotal={chapterTotal}
              previewOverflow={chapter.previewOverflow}
              previewWidth={chapter.previewWidth}
              previews={chapterPreviews(chapter.previewKey)}
              steps={chapter.steps}
              title={chapter.title}
            />
          </GuideBand>
        </Box>
      ))}

      <Divider />

      <GuideBand paddingY={6}>
        <VStack gap={4} width="100%">
          <GuideSectionHeader
            subtitle="Developer reference — component map and stack"
            title="Appendix"
          />
          <VStack gap={3} width="100%">
            <Text font="title3">Component map</Text>
            <AppendixTable
              columns={['Region', 'File', 'CDS']}
              rows={COMPONENT_MAP.map((row) => ({
                key: row.region,
                a: row.region,
                b: row.file,
                c: row.cds,
              }))}
            />
          </VStack>
          <Divider />
          <VStack gap={3} width="100%">
            <Text font="title3">Stack</Text>
            <AppendixTable
              columns={['Layer', 'Choice', 'Notes']}
              rows={STACK_ROWS.map((row) => ({
                key: row.layer,
                a: row.layer,
                b: row.choice,
                c: row.notes,
              }))}
            />
          </VStack>
        </VStack>
      </GuideBand>
    </VStack>
  );
};
