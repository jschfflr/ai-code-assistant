import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Config {
  openaiApiKey: string;
  openaiModel: string;
}

const ConfigContext = createContext<Config>({
  openaiApiKey: '',
  openaiModel: '',
});

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<Config>({
    openaiApiKey: '',
    openaiModel: '',
  });

  useEffect(() => {
    const script = document.getElementById('config');

    if (script && script.textContent) {
      try {
        const configData = JSON.parse(script.textContent);
        setConfig(configData);
      } catch (error) {
        console.error('Failed to parse config', error);
      }
    }
  }, []);

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
