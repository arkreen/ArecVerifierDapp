'use custom'
import Image from 'next/image'
import check, { MinerRecord, setKey } from '@/utils/ArecVerifierCheck'
import { useEffect, useRef, useState } from 'react'
import { Input } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, RadioGroup, Radio } from "@nextui-org/react";

const apiToken = 'web3.storage'

export default function Home() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [minersList, setMinersList] = useState<{ address: string, records: MinerRecord[] }[]>([])
    const currentIndex = useRef(-1)
    const [logs, setLogs] = useState<string[]>([])
    const [tokenIdInvalid, setTokenIdInvalid] = useState(false)
    const [tokenId, setTokenId] = useState('');

    function logCb(value: string) {
        setLogs(state => {
            return [...state, value]
        })
    }
    function valueCb(v: { type: 'address' | 'record', value: MinerRecord | string }) {
        console.log(v)
        const { type, value } = v
        if (type == 'address') {
            currentIndex.current += 1
            setMinersList(state => {
                return [...state, { address: value as string, records: [] }]
            })
        } else if (type == 'record') {
            setMinersList(state => {
                const newState = [...state]
                newState[currentIndex.current].records.push(value as MinerRecord)
                return newState
            })
        }
    }
    function handleGotoArecClick() {
        window.open('https://arec.arkreen.com/#/Overview', '_blank')
    }
    function handleGotoWeb3Click() {
        // 打开新页面，跳转到web3.storage
        window.open('https://web3.storage/', '_blank')
    }
    function handleResetClicl() {
        setTokenId('')
    }
    function handleVerifyClick() {
        if (!tokenId) {
            setTokenIdInvalid(true)
            return
        }
        // 如果tokenId不是数字类型的字符串，提示错误
        if (isNaN(Number(tokenId))) {
            setTokenIdInvalid(true)
            return
        }
        onOpen()
        const _key = new Date().getTime()
        setKey(_key)
        check(apiToken, tokenId, logCb, valueCb, _key)
    }
    function handleInputClick(value: string) {
        console.log('handleInputClick')
        // todo 复制当前文本到剪贴板
    }
    function clearData () {
        const _key = new Date().getTime()
        setKey(_key)
        console.log('clearData')
        setLogs([])
        setMinersList([])
        currentIndex.current = -1
    }
    const link = 'https://bafkreidysd6q2cnyhoiowjnur34lnulqsh3nzvghdut6z3fbiss4wmlfzy.ipfs.w3s.link'
    return (
        <main className="bg-white rounded-md absolute top-1/2 left-[20px] right-[20px] -translate-y-1/2 lg:w-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:right-auto">
            <div className='p-4'>
                <div className='mb-5 items-center lg:flex'>
                    <Input isClearable className='lg:flex-1 mb-2 lg:mr-2' label="AREC Token ID" value={tokenId} onValueChange={(v) => { setTokenIdInvalid(false);setTokenId(v)}} isInvalid={tokenIdInvalid} errorMessage={ tokenIdInvalid ? 'Please enter a valid tokenId' : ''} />
                    <Button onClick={handleGotoArecClick} color="default">Goto Arkreen AREC</Button>
                </div>
                <div className='flex flex-row-reverse'>
                    <Button color="primary" onClick={handleVerifyClick}>Verify</Button>
                    <Button className='mr-2' onClick={handleResetClicl} variant="bordered">Reset</Button>
                </div>
            </div>
            <Modal
                isOpen={isOpen}
                placement='center'
                onOpenChange={onOpenChange}
                scrollBehavior='inside'
                backdrop='blur'
                size='5xl'
                isDismissable={false}
                onClose={() => {
                    clearData()
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Result</ModalHeader>
                            <ModalBody>
                                <div className='w-full lg:flex'>
                                    <div className='w-full border p-2 pb-4 mb-6 rounded-md lg:flex-1 lg:mr-4 lg:mb-0'>
                                        {minersList.map((item, index) => {
                                            return (
                                                <div className='mb-10' key={item.address}>
                                                    <div className='border-b pb-2 mb-2'>
                                                        <div className='mb-2'>Miner {index + 1}:</div>
                                                        <Input onClick={() => handleInputClick(link)} isReadOnly fullWidth value={item.address} />
                                                    </div>
                                                    <div>
                                                        { item.records.map(record => {
                                                            return <div className='mb-5 last:mb-0' key={record.url}>
                                                                <Input className='mr-5 mb-2' onClick={() => handleInputClick(link)} isReadOnly fullWidth value={record.url} />
                                                                <div className='flex'>
                                                                    <div className='flex-1 mr-2 border p-1 px-2 rounded-md lg:flex-none'>{ record.date }</div>
                                                                    <div className='flex-1 p-1 border px-2 rounded-md lg:flex-none'>{ record.energy.toString() }Wh</div>
                                                                </div>
                                                        </div>
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className='w-full border p-10 rounded-md lg:w-[400px]'>
                                        { logs.map((log, index) => <div className='break-words mb-1' key={index}>{log}</div>) }
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={() => {
                                    onClose()
                                }}>
                                    Cancel
                                </Button>
                                <Button color="primary" onPress={() => { 
                                    onClose()
                                }}>
                                    OK
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </main>

    )
}
