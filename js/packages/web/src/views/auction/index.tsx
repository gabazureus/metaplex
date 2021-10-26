import { CheckOutlined } from '@ant-design/icons';
import {
  AuctionState,
  BidderMetadata,
  formatTokenAmount,
  Identicon,
  MetaplexModal,
  ParsedAccount,
  shortenAddress,
  StringPublicKey,
  toPublicKey,
  useConnection,
  useConnectionConfig,
  useMint,
} from '@oyster/common';
import { AuctionViewItem } from '@oyster/common/dist/lib/models/metaplex/index';
import { getHandleAndRegistryKey } from '@solana/spl-name-service';
import { MintInfo } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { Button, Card, Carousel, Col, List, Row, Skeleton } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'timeago.js';
import { AmountLabel } from '../../components/AmountLabel';
import { ArtContent } from '../../components/ArtContent';
import { AuctionCard } from '../../components/AuctionCard';
import { ClickToCopy } from '../../components/ClickToCopy';
import { MetaAvatar } from '../../components/MetaAvatar';
import {
  AuctionView as Auction,
  useArt,
  useAuction,
  useBidsForAuction,
  useCreators,
  useExtendedArt,
} from '../../hooks';
import { ArtType } from '../../types';
import useWindowDimensions from '../../utils/layout';

export const AuctionItem = ({
  item,
  active,
}: {
  item: AuctionViewItem;
  active?: boolean;
}) => {
  const id = item.metadata.pubkey;
  return <ArtContent pubkey={id} active={active} allowMeshRender={true} />;
};

export const AuctionView = () => {
  const { id } = useParams<{ id: string }>();
  const { env } = useConnectionConfig();
  const auction = useAuction(id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const art = useArt(auction?.thumbnail.metadata.pubkey);
  const { ref, data } = useExtendedArt(auction?.thumbnail.metadata.pubkey);
  const creators = useCreators(auction);
  let edition = '';
  if (art.type === ArtType.NFT) {
    edition = 'Unique';
  } else if (art.type === ArtType.Master) {
    edition = 'NFT 0';
  } else if (art.type === ArtType.Print) {
    edition = `${art.edition} of ${art.supply}`;
  }
  const nftCount = auction?.items.flat().length;
  const winnerCount = auction?.items.length;

  const hasDescription = data === undefined || data.description === undefined;
  const description = data?.description;
  const attributes = data?.attributes;

  const items = [
    ...(auction?.items
      .flat()
      .reduce((agg, item) => {
        agg.set(item.metadata.pubkey, item);
        return agg;
      }, new Map<string, AuctionViewItem>())
      .values() || []),
    auction?.participationItem,
  ].map((item, index) => {
    if (!item || !item?.metadata || !item.metadata?.pubkey) {
      return null;
    }

    return (
      <AuctionItem
        key={item.metadata.pubkey}
        item={item}
        active={index === currentIndex}
      />
    );
  });

  return (
    <Row justify="center" ref={ref} gutter={[48, 0]}>
      <Col span={24} md={10}>
        <div>
          <Carousel
            autoplay={false}
            afterChange={index => setCurrentIndex(index)}
          >
            {items}
          </Carousel>
        </div>
        <h6>ABOUT THIS {nftCount === 1 ? 'NFT' : 'COLLECTION'}</h6>
        <p>
          {hasDescription && <Skeleton paragraph={{ rows: 3 }} />}
          {description ||
            (winnerCount !== undefined && <div>No description provided.</div>)}
        </p>
        {attributes && (
          <div>
            <h6>Attributes</h6>
            <List grid={{ column: 4 }}>
              {attributes.map((attribute, index) => (
                <List.Item key={`${attribute.value}-${index}`}>
                  <Card title={attribute.trait_type}>{attribute.value}</Card>
                </List.Item>
              ))}
            </List>
          </div>
        )}
        {/* {auctionData[id] && (
            <>
              <h6>About this Auction</h6>
              <p>{auctionData[id].description.split('\n').map((t: string) => <div>{t}</div>)}</p>
            </>
          )} */}
      </Col>

      <Col span={24} md={14}>
        <h2>{art.title || <Skeleton paragraph={{ rows: 0 }} />}</h2>
        <Row gutter={[44, 0]}>
          <Col span={12} md={16}>
            <div>
              <div>
                <h6>CREATED BY</h6>
                <span>{<MetaAvatar creators={creators} />}</span>
              </div>
              <div>
                <h6>Edition</h6>
                <span>
                  {(auction?.items.length || 0) > 1 ? 'Multiple' : edition}
                </span>
              </div>
              <div>
                <h6>Winners</h6>
                <span>
                  {winnerCount === undefined ? (
                    <Skeleton paragraph={{ rows: 0 }} />
                  ) : (
                    winnerCount
                  )}
                </span>
              </div>
              <div>
                <h6>NFTS</h6>
                <span>
                  {nftCount === undefined ? (
                    <Skeleton paragraph={{ rows: 0 }} />
                  ) : (
                    nftCount
                  )}
                </span>
              </div>
            </div>
          </Col>
          <Col span={12} md={8}>
            <div>
              <h6>View on</h6>
              <div>
                <Button onClick={() => window.open(art.uri || '', '_blank')}>
                  Arweave
                </Button>
                <Button
                  onClick={() =>
                    window.open(
                      `https://explorer.solana.com/account/${art?.mint || ''}${
                        env.indexOf('main') >= 0 ? '' : `?cluster=${env}`
                      }`,
                      '_blank',
                    )
                  }
                >
                  Solana
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {!auction && <Skeleton paragraph={{ rows: 6 }} />}
        {auction && (
          <AuctionCard auctionView={auction} hideDefaultAction={false} />
        )}
        {!auction?.isInstantSale && <AuctionBids auctionView={auction} />}
      </Col>
    </Row>
  );
};

const BidLine = (props: {
  bid: ParsedAccount<BidderMetadata>;
  index: number;
  mint?: MintInfo;
  isCancelled?: boolean;
  isActive?: boolean;
}) => {
  const { bid, mint, isCancelled } = props;
  const { publicKey } = useWallet();
  const bidder = bid.info.bidderPubkey;
  const isme = publicKey?.toBase58() === bidder;

  // Get Twitter Handle from address
  const connection = useConnection();
  const [bidderTwitterHandle, setBidderTwitterHandle] = useState('');
  useEffect(() => {
    const getTwitterHandle = async (
      connection: Connection,
      bidder: StringPublicKey,
    ): Promise<string | undefined> => {
      try {
        const [twitterHandle] = await getHandleAndRegistryKey(
          connection,
          toPublicKey(bidder),
        );
        setBidderTwitterHandle(twitterHandle);
      } catch (err) {
        console.warn(`err`);
        return undefined;
      }
    };
    getTwitterHandle(connection, bidder);
  }, [bidderTwitterHandle]);

  return (
    <Row wrap={false}>
      {isCancelled ? (
        <Col flex="0 0 auto">
          <div />
        </Col>
      ) : (
        <>
          <Col flex="0 0 auto">
            {isme && (
              <>
                <CheckOutlined />
                &nbsp;
              </>
            )}
          </Col>
          <Col flex="0 0 auto">
            <AmountLabel
              displaySOL={true}
              amount={formatTokenAmount(bid.info.lastBid, mint)}
            />
          </Col>
        </>
      )}

      <Col flex="0 0 auto">
        {/* uses milliseconds */}
        {format(bid.info.lastBidTimestamp.toNumber() * 1000)}
      </Col>
      <Col flex="1 0 0 " />
      <Col flex="0 0 auto">
        <Identicon size={24} address={bidder} />{' '}
      </Col>
      <Col flex="0 0 auto">
        {bidderTwitterHandle ? (
          <a
            target="_blank"
            rel="noopener noreferrer"
            title={shortenAddress(bidder)}
            href={`https://twitter.com/${bidderTwitterHandle}`}
          >{`@${bidderTwitterHandle}`}</a>
        ) : (
          shortenAddress(bidder)
        )}
      </Col>
      <Col flex="0 0 auto">
        <ClickToCopy copyText={bidder} />
      </Col>
    </Row>
  );
};

export const AuctionBids = ({
  auctionView,
}: {
  auctionView?: Auction | null;
}) => {
  const bids = useBidsForAuction(auctionView?.auction.pubkey || '');

  const mint = useMint(auctionView?.auction.info.tokenMint);
  const { width } = useWindowDimensions();

  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const winnersCount = auctionView?.auction.info.bidState.max.toNumber() || 0;
  const activeBids = auctionView?.auction.info.bidState.bids || [];
  const activeBidders = useMemo(() => {
    return new Set(activeBids.map(b => b.key));
  }, [activeBids]);

  const auctionState = auctionView
    ? auctionView.auction.info.state
    : AuctionState.Created;
  const bidLines = useMemo(() => {
    let activeBidIndex = 0;
    return bids.map((bid, index) => {
      const isCancelled =
        (index < winnersCount && !!bid.info.cancelled) ||
        (auctionState !== AuctionState.Ended && !!bid.info.cancelled);

      const line = (
        <BidLine
          bid={bid}
          index={activeBidIndex}
          key={index}
          mint={mint}
          isCancelled={isCancelled}
          isActive={!bid.info.cancelled}
        />
      );

      if (!isCancelled) {
        activeBidIndex++;
      }

      return line;
    });
  }, [auctionState, bids, activeBidders]);

  if (!auctionView || bids.length < 1) return null;

  return (
    <Row>
      <Col>
        <h6>Bid History</h6>
        {bidLines.slice(0, 10)}
        {bids.length > 10 && (
          <div onClick={() => setShowHistoryModal(true)}>View full history</div>
        )}
        <MetaplexModal
          visible={showHistoryModal}
          onCancel={() => setShowHistoryModal(false)}
          title="Bid history"
          centered
          width={width < 768 ? width - 10 : 600}
        >
          <div>{bidLines}</div>
        </MetaplexModal>
      </Col>
    </Row>
  );
};
