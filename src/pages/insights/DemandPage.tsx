import { useTranslation } from 'react-i18next';
import { HistoricalDemandHeatmap } from '../../components/heatmap/HistoricalDemandHeatmap';

export const DemandPage = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-foreground">
          {t('insights:demand.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('insights:demand.subtitle')}
        </p>
      </header>
      <HistoricalDemandHeatmap />
    </div>
  );
};
