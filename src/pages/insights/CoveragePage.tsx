import { useTranslation } from 'react-i18next';
import { CoverageHeatmap } from '../../components/heatmap/CoverageHeatmap';

export const CoveragePage = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-foreground">
          {t('insights:coverage.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('insights:coverage.subtitle')}
        </p>
      </header>
      <CoverageHeatmap />
    </div>
  );
};
