import { Button, ButtonProps, Modal, Row } from 'antd';
import React, { useMemo, useState } from 'react';
import { SafetyDepositDraft } from '../../actions/createAuctionManager';
import { MetaplexMasonry } from '../../components/MetaplexMasonry';
import { useUserArts } from '../../hooks';
import { ArtCard } from './../../components/ArtCard';

export interface ArtSelectorProps extends ButtonProps {
  selected: SafetyDepositDraft[];
  setSelected: (selected: SafetyDepositDraft[]) => void;
  allowMultiple: boolean;
  filter?: (i: SafetyDepositDraft) => boolean;
}

export const ArtSelector = (props: ArtSelectorProps) => {
  const { selected, setSelected, allowMultiple, ...rest } = props;
  let items = useUserArts();
  if (props.filter) items = items.filter(props.filter);
  const selectedItems = useMemo<Set<string>>(
    () => new Set(selected.map(item => item.metadata.pubkey)),
    [selected],
  );

  const [visible, setVisible] = useState(false);

  const open = () => {
    clear();

    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  const clear = () => {
    setSelected([]);
  };

  const confirm = () => {
    close();
  };

  return (
    <>
      <MetaplexMasonry>
        {selected.map(m => {
          let key = m?.metadata.pubkey || '';

          return (
            <ArtCard
              key={key}
              pubkey={m.metadata.pubkey}
              preview={false}
              onClick={open}
              close={() => {
                setSelected(selected.filter(_ => _.metadata.pubkey !== key));
                confirm();
              }}
            />
          );
        })}
        {(allowMultiple || selectedItems.size === 0) && (
          <div onClick={open}>Add an NFT</div>
        )}
      </MetaplexMasonry>

      <Modal
        visible={visible}
        onCancel={close}
        onOk={confirm}
        width={1100}
        footer={null}
      >
        <Row>
          <h2>Select the NFT you want to sell</h2>
          <p>Select the NFT that you want to sell copy/copies of.</p>
        </Row>
        <Row>
          <MetaplexMasonry>
            {items.map(m => {
              const id = m.metadata.pubkey;
              const isSelected = selectedItems.has(id);

              const onSelect = () => {
                let list = [...selectedItems.keys()];
                if (allowMultiple) {
                  list = [];
                }

                const newSet = isSelected
                  ? new Set(list.filter(item => item !== id))
                  : new Set([...list, id]);

                let selected = items.filter(item =>
                  newSet.has(item.metadata.pubkey),
                );
                setSelected(selected);

                if (!allowMultiple) {
                  confirm();
                }
              };

              return (
                <ArtCard
                  key={id}
                  pubkey={m.metadata.pubkey}
                  preview={false}
                  onClick={onSelect}
                />
              );
            })}
          </MetaplexMasonry>
        </Row>
        <Row>
          <Button type="primary" size="large" onClick={confirm}>
            Confirm
          </Button>
        </Row>
      </Modal>
    </>
  );
};
