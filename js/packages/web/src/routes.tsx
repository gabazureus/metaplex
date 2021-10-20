import { HashRouter, Route, Switch } from 'react-router-dom';
import { Storefront } from '@oyster/common';
import { Providers } from './providers';
import {
  AnalyticsView,
  ArtCreateView,
  ArtistsView,
  ArtistView,
  ArtView,
  ArtworksView,
  AuctionCreateView,
  AuctionView,
  HomeView,
} from './views';
import { AdminView } from './views/admin';
import { BillingView } from './views/auction/billing';

interface RoutesProps {
  storefront: Storefront;
}

export function Routes({ storefront }: RoutesProps) {
  return (
    <>
      <HashRouter basename={'/'}>
        <Providers storefront={storefront}>
          <Switch>
            <Route exact path="/admin" component={() => <AdminView />} />
            {/* <Route
              exact
              path="/analytics"
              component={() => <AnalyticsView />}
            /> */}
            <Route
              exact
              path="/artworks/new/:step_param?"
              component={() => <ArtCreateView />}
            />
            <Route
              exact
              path="/artworks"
              component={() => <ArtworksView />}
            />
            <Route exact path="/artworks/:id" component={() => <ArtView />} />
            <Route exact path="/artists/:id" component={() => <ArtistView />} />
            <Route exact path="/artists" component={() => <ArtistsView />} />
            <Route
              exact
              path="/auction/create/:step_param?"
              component={() => <AuctionCreateView />}
            />
            <Route
              exact
              path="/auction/:id"
              component={() => <AuctionView />}
            />
            <Route
              exact
              path="/auction/:id/billing"
              component={() => <BillingView />}
            />
            <Route path="/" component={() => <HomeView />} />
          </Switch>
        </Providers>
      </HashRouter>
    </>
  );
}
