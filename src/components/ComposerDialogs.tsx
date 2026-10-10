import type { ReadyComposer } from '../composer/useComposer';
import { Dialog } from './Dialog';
import { CreateDialog } from './CreateDialog';
import { SettingsDialog } from './SettingsDialog';
import { HistoryDialog } from './HistoryDialog';
import { CommandsDialog } from './CommandsDialog';
import { HelpDialog } from './HelpDialog';
export function ComposerDialogs({ c }: { c: ReadyComposer }) {
  const { title, error, dialog, setDialog, settings, setKey, history, session } = c;
  return (
    <>
      {dialog && (
        <Dialog
          title={
            {
              workspace: '新建工作区',
              document: '新建文档',
              session: '新建会话',
              settings: '模型设置',
              history: '历史快照',
              commands: '快速操作',
              help: '使用 Icimik Composer'
            }[dialog]
          }
          onClose={() => {
            setDialog('');
            setKey('');
          }}
        >
          {error && (
            <p className="message error" role="alert">
              {error}
            </p>
          )}
          <fieldset
            className="write-boundary"
            disabled={
              c.transitioning ||
              (!c.available && !['workspace', 'help', 'commands'].includes(dialog))
            }
          >
            <CreateDialog c={c} />
            <SettingsDialog c={c} />
            <HistoryDialog c={c} />
            <CommandsDialog c={c} />
            <HelpDialog c={c} />
          </fieldset>
        </Dialog>
      )}
    </>
  );
}
