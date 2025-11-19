import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  HStack,
  Tag,
  Text,
  VStack,
} from '@chakra-ui/react';
import { HeadlessTimelineList } from '../../headless';
import type { StoreApi } from '../../../../../src/vanilla';
import type { HistoryEntry } from '../../headless';

/**
 * Timeline component using Chakra UI
 *
 * Demonstrates how to use the headless HeadlessTimelineList component
 * with Chakra UI's component library.
 *
 * @example
 * ```tsx
 * <ChakraTimeline store={myStore} title="State History" />
 * ```
 */
interface ChakraTimelineProps<T = any> {
  /** The Bruin store instance */
  store: StoreApi<T>;

  /** Optional title for the timeline */
  title?: string;

  /** Optional description text */
  description?: string;

  /** Custom render function for entry content */
  renderEntryContent?: (state: T, timestamp: number) => React.ReactNode;
}

export function ChakraTimeline<T = any>({
  store,
  title = 'History Timeline',
  description,
  renderEntryContent,
}: ChakraTimelineProps<T>) {
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
        <HeadlessTimelineList
          store={store}
          renderEntry={(entry: HistoryEntry<T>, index: number, isCurrent: boolean) => (
            <Box
              key={index}
              p={3}
              mb={2}
              borderWidth={isCurrent ? 2 : 1}
              borderColor={isCurrent ? 'blue.500' : 'gray.200'}
              borderRadius="md"
              bg={isCurrent ? 'blue.50' : 'white'}
              shadow={isCurrent ? 'md' : 'sm'}
              transition="all 0.2s"
              _hover={{
                shadow: 'md',
              }}
            >
              <HStack justify="space-between" align="center">
                <Box flex={1}>
                  {renderEntryContent ? (
                    renderEntryContent(entry.state, entry.timestamp)
                  ) : (
                    <Text as="code" fontSize="sm" fontFamily="mono" bg="gray.100" p={1} borderRadius="sm">
                      {JSON.stringify(entry.state)}
                    </Text>
                  )}
                </Box>
                <HStack spacing={2}>
                  {isCurrent && (
                    <Tag colorScheme="blue" size="sm" fontWeight="bold">
                      Current
                    </Tag>
                  )}
                  <Text fontSize="xs" color="gray.500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </Text>
                </HStack>
              </HStack>
            </Box>
          )}
          emptyMessage={
            <Box py={12} textAlign="center">
              <Text color="gray.500">
                No history entries yet. Make some changes to see history!
              </Text>
            </Box>
          }
        />
      </CardBody>
    </Card>
  );
}
