/**
 * COGLayer wrapper that propagates opacity to sublayers.
 *
 * @developmentseed/deck.gl-geotiff's COGLayer does not pass opacity to its
 * RasterLayer/PathLayer sublayers, so layer control opacity changes have no
 * visual effect. This subclass applies opacity to the rendered sublayers.
 */

import { COGLayer } from '@developmentseed/deck.gl-geotiff';
import type { Layer, LayersList } from '@deck.gl/core';

type LayersOutput = Layer | LayersList | null;
type MinimalDataT = { width: number; height: number };

function applyOpacity(layers: LayersOutput, opacity: number): LayersOutput {
  if (!layers) return layers;
  if (Array.isArray(layers)) {
    return layers.map(layer => applyOpacity(layer as LayersOutput, opacity)) as LayersOutput;
  }

  if (typeof (layers as Layer).clone === 'function') {
    return (layers as Layer).clone({ opacity });
  }

  return layers;
}

export class COGLayerWithOpacity<DataT extends MinimalDataT = MinimalDataT> extends COGLayer<DataT> {
  _renderSubLayers(
    ...args: Parameters<COGLayer<DataT>['_renderSubLayers']>
  ): ReturnType<COGLayer<DataT>['_renderSubLayers']> {
    const layers = super._renderSubLayers(...args);
    const opacity = this.props.opacity;
    if (opacity === undefined || opacity === null) {
      return layers;
    }

    const clamped = Math.max(0, Math.min(1, opacity));
    return applyOpacity(layers as LayersOutput, clamped) as ReturnType<COGLayer<DataT>['_renderSubLayers']>;
  }
}
