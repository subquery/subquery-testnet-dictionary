import {EvmLog} from "@polkadot/types/interfaces"
import {SubstrateExtrinsic,SubstrateEvent,SubstrateBlock} from "@subql/types";
import { SpecVersion, Event, Extrinsic, EvmLog as EvmLogModel, EvmTransaction } from "../types";
import { MoonbeamCall } from "@subql/contract-processors/dist/moonbeam";


export async function handleBlock(block: SubstrateBlock): Promise<void> {
    const specVersion = await SpecVersion.get(block.specVersion.toString());
    if(specVersion === undefined){
        const newSpecVersion = new SpecVersion(block.specVersion.toString());
        newSpecVersion.blockHeight = block.block.header.number.toBigInt();
        await newSpecVersion.save();
    }
}

export async function handleEvent(event: SubstrateEvent): Promise<void> {
    const thisEvent = await Event.get(`${event.block.block.header.number}-${event.idx.toString()}`);
    if(thisEvent === undefined){
        const newEvent = new Event(`${event.block.block.header.number}-${event.idx.toString()}`);
        newEvent.blockHeight = event.block.block.header.number.toBigInt();
        newEvent.module = event.event.section;
        newEvent.event = event.event.method;
        await newEvent.save();
    }
    if (event.event.section === 'evm' && event.event.method === 'Log') {
        await handleEvmEvent(event);
    }
}

export async function handleCall(extrinsic: SubstrateExtrinsic): Promise<void> {
    const thisExtrinsic = await Extrinsic.get(extrinsic.extrinsic.hash.toString());
    if(thisExtrinsic === undefined){
        const newExtrinsic = new Extrinsic(extrinsic.extrinsic.hash.toString());
        newExtrinsic.module = extrinsic.extrinsic.method.section;
        newExtrinsic.call = extrinsic.extrinsic.method.method;
        newExtrinsic.blockHeight = extrinsic.block.block.header.number.toBigInt();
        newExtrinsic.success = extrinsic.success;
        newExtrinsic.isSigned = extrinsic.extrinsic.isSigned;
        await newExtrinsic.save();
    }
}

async function handleEvmEvent(event: SubstrateEvent): Promise<void> {
    const [{address, data, topics}] = event.event.data as unknown as [EvmLog];
    const log = EvmLogModel.create({
        id: `${event.block.block.header.number.toString()}-${event.idx}`,
        address: address.toString(),
        data: data.toHex(),
        blockHeight: event.block.block.header.number.toBigInt(),
        topics0: topics[0].toHex(),
        topics1: topics[1]?.toHex(),
        topics2: topics[2]?.toHex(),
        topics3: topics[3]?.toHex(),
    });
    await log.save();
}

export async function handleEvmTransaction(tx: MoonbeamCall): Promise<void> {
    const transaction = EvmTransaction.create({
        id: tx.hash,
        from: tx.from,
        to: tx.to,
        gasLimit: BigInt(tx.gasLimit.toString()),
        gasPrice: BigInt(tx.gasPrice.toString()),
        data: tx.data,
        value: BigInt(tx.value.toString()),
        blockHeight: BigInt(tx.blockNumber.toString()),
        timestamp: new Date(tx.timestamp),
    });
    await transaction.save();
}
