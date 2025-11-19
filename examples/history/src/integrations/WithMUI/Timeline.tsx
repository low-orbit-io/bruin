import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { HeadlessTimelineList } from '../../headless';
import type { StoreApi } from '../../../../../src/vanilla';
import type { HistoryEntry } from '../../headless';

/**
 * Timeline component using Material-UI (MUI)
 *
 * Demonstrates how to use the headless HeadlessTimelineList component
 * with Material-UI's component library.
 *
 * @example
 * ```tsx
 * <MUITimeline store={myStore} title="State History" />
 * ```
 */
interface MUITimelineProps<T = any> {
  /** The Bruin store instance */
  store: StoreApi<T>;

  /** Optional title for the timeline */
  title?: string;

  /** Optional description text */
  description?: string;

  /** Custom render function for entry content */
  renderEntryContent?: (state: T, timestamp: number) => React.ReactNode;
}

export function MUITimeline<T = any>({
  store,
  title = 'History Timeline',
  description,
  renderEntryContent,
}: MUITimelineProps<T>) {
  return (
    <Card elevation={2}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" component="h3" gutterBottom>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>

          <Divider />

          <HeadlessTimelineList
            store={store}
            renderEntry={(entry: HistoryEntry<T>, index: number, isCurrent: boolean) => (
              <Paper
                key={index}
                elevation={isCurrent ? 4 : 1}
                sx={{
                  p: 2,
                  mb: 1,
                  bgcolor: isCurrent ? 'primary.light' : 'background.paper',
                  border: isCurrent ? 2 : 1,
                  borderColor: isCurrent ? 'primary.main' : 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    elevation: 2,
                  },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box flex={1}>
                    {renderEntryContent ? (
                      renderEntryContent(entry.state, entry.timestamp)
                    ) : (
                      <Typography variant="body2" component="code" fontFamily="monospace">
                        {JSON.stringify(entry.state)}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {isCurrent && (
                      <Chip
                        label="Current"
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            )}
            emptyMessage={
              <Box py={8} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  No history entries yet. Make some changes to see history!
                </Typography>
              </Box>
            }
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
