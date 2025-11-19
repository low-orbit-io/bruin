import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Collapse,
  Divider,
  Heading,
  HStack,
  Tag,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { HeadlessTimelineCompact } from '../../headless';
import type { StoreApi } from '../../../../../src/vanilla';
import type { HistoryEntry } from '../../headless';

/**
 * Compact history controls using Chakra UI
 *
 * Demonstrates how to use the headless HeadlessTimelineCompact component
 * with Chakra UI's component library.
 *
 * @example
 * ```tsx
 * <ChakraControls store={myStore} title="History Controls" />
 * ```
 */
interface ChakraControlsProps<T = any> {
  /** The Bruin store instance */
  store: StoreApi<T>;

  /** Optional title for the controls */
  title?: string;

  /** Optional description text */
  description?: string;

  /** Custom render function for timeline entries when expanded */
  renderEntryContent?: (state: T, timestamp: number) => React.ReactNode;
}

export function ChakraControls<T = any>({
  store,
  title = 'History Controls',
  description,
  renderEntryContent,
}: ChakraControlsProps<T>) {
  return (
    <Card variant="elevated" size="md">
      <CardHeader>
        <Heading size="md">{title}</Heading>
        {description && (
          <Text color="gray.600" fontSize="sm" mt={1}>
            {description}
          </Text>
        )}
      </CardHeader>

      <Divider />

      <CardBody>
        <HeadlessTimelineCompact
          store={store}
          renderControls={({
            canUndo,
            canRedo,
            currentIndex,
            totalEntries,
            undo,
            redo,
            toggleList,
            showList,
          }) => (
            <VStack spacing={4} align="stretch">
              <HStack spacing={3} wrap="wrap">
                <Button
                  colorScheme="blue"
                  onClick={undo}
                  isDisabled={!canUndo}
                  leftIcon={<span>←</span>}
                  minW="100px"
                >
                  Undo
                </Button>

                <Tag
                  size="lg"
                  colorScheme="gray"
                  fontFamily="mono"
                  fontWeight="bold"
                  fontSize="lg"
                  px={4}
                >
                  {currentIndex + 1} / {totalEntries}
                </Tag>

                <Button
                  colorScheme="blue"
                  onClick={redo}
                  isDisabled={!canRedo}
                  rightIcon={<span>→</span>}
                  minW="100px"
                >
                  Redo
                </Button>

                <Button
                  variant="outline"
                  onClick={toggleList}
                  ml="auto"
                >
                  {showList ? 'Hide' : 'Show'} Timeline
                </Button>
              </HStack>

              <HStack spacing={2}>
                <Tag
                  size="sm"
                  colorScheme={canUndo ? 'green' : 'gray'}
                  variant="subtle"
                >
                  <Box
                    as="span"
                    display="inline-block"
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg={canUndo ? 'green.500' : 'gray.400'}
                    mr={2}
                  />
                  Can Undo: {canUndo.toString()}
                </Tag>
                <Tag
                  size="sm"
                  colorScheme={canRedo ? 'green' : 'gray'}
                  variant="subtle"
                >
                  <Box
                    as="span"
                    display="inline-block"
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg={canRedo ? 'green.500' : 'gray.400'}
                    mr={2}
                  />
                  Can Redo: {canRedo.toString()}
                </Tag>
              </HStack>

              <Collapse in={showList} animateOpacity>
                <Box>
                  <Divider my={4} />
                  {/* Placeholder for list rendering */}
                </Box>
              </Collapse>
            </VStack>
          )}
          renderList={(entries: HistoryEntry<T>[], currentIndex: number) => (
            <VStack spacing={2} align="stretch">
              <Text fontWeight="semibold" fontSize="sm">
                History Timeline:
              </Text>
              <Wrap spacing={2}>
                {entries.map((entry, index) => {
                  const isCurrent = index === currentIndex;
                  return (
                    <WrapItem key={index}>
                      <Tag
                        size="md"
                        colorScheme={isCurrent ? 'blue' : 'gray'}
                        variant={isCurrent ? 'solid' : 'outline'}
                        fontWeight={isCurrent ? 'bold' : 'normal'}
                      >
                        {renderEntryContent
                          ? renderEntryContent(entry.state, entry.timestamp)
                          : `#${index + 1}`}
                      </Tag>
                    </WrapItem>
                  );
                })}
              </Wrap>
            </VStack>
          )}
        />
      </CardBody>
    </Card>
  );
}
