import type { ReadyComposer } from '../composer/useComposer';
import { bridge, desktop } from '../composer/shared';

export function SettingsDialog({ c }: { c: ReadyComposer }) {
  const { setNotice, dialog, setDialog, settings, setSettings, key, setKey, w, run } = c;
  return (
    <>
      {dialog === 'settings' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const s = await bridge.setSettings(w.id, settings.endpoint, settings.model, key);
              setSettings(s);
              setKey('');
              setDialog('');
              setNotice('模型设置已保存，密钥不会发送到编辑器。');
            });
          }}
        >
          <p className="dialog-description">
            支持 OpenAI 兼容的 Chat Completions
            API。仅在本机配置；密钥由系统安全存储加密，不写入作品目录或仓库。
          </p>
          {!desktop && <p className="warning">浏览器预览不接收密钥。</p>}
          <label className="field">
            API 基础地址
            <input
              value={settings.endpoint}
              onChange={(e) => setSettings({ ...settings, endpoint: e.target.value })}
              type="url"
              required
              disabled={!desktop}
            />
          </label>
          <label className="field">
            模型名称
            <input
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              required
              placeholder="填写供应商提供的模型 ID"
              disabled={!desktop}
            />
          </label>
          <label className="field">
            API 密钥
            <input
              type="password"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={settings.hasKey ? '已保存；留空保留原密钥' : '仅保存在本机'}
              required={!settings.hasKey}
              disabled={!desktop}
            />
          </label>
          <p className="privacy-note">
            点击生成时，所示发送范围会传给此地址对应的服务。请确认你信任该服务以及它的稿件处理政策。
          </p>
          <button className="primary-button" type="submit" disabled={!desktop}>
            保存模型设置
          </button>
        </form>
      )}
    </>
  );
}
