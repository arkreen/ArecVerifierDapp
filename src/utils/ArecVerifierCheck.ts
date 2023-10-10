import { Contract, InfuraProvider } from "ethers";
import axios from 'axios';
// @ts-ignore
import { Web3Storage } from 'web3.storage'

const sleep = (time: number) => {
    return new Promise(resolve => setTimeout(resolve, time))
}

axios.defaults.timeout = 0

const separator1 = "=".repeat(20);
const separator2 = "-".repeat(20);

const tab = '\t'
const tabLength1 = 20;
const tabLength2 = 10;
const paddedTab1 = tab.padEnd(tabLength1, ' ');
const paddedTab2 = tab.padEnd(tabLength2, ' ');

type cbFn<T> = (value: T) => void;

export let currentKey = {
    value: new Date().getTime()
}
export function setKey (value: number) {
    currentKey = { value }
}

export interface MinerRecord {
    url: string;
    date: string;
    energy: bigint;
}

export default async function main(apiToken: string, tokenId: string, log: cbFn<string>, minerInfoCb: cbFn<{ type: 'address' | 'record' ;  value: MinerRecord | string}>, key: number) {

    if (tokenId == undefined) {
        log('ARGUMENTS\n  <tokenid> - AREC token ID number to verify')
        return
    }

    if (apiToken == undefined) {
        log('ARGUMENTS\n  <tokenid> - AREC token ID number to verify')
        return
    }

    const client = new Web3Storage({ token: apiToken });
    log('Start to process...')
    log(separator1 + '\n');
    log('Getting the info from the contract by the token ID which is ' + tokenId + ' ...')

    // Get the cid and other info from the contract by the token ID
    let rec_issuance_contract_address = '0x954585adF9425F66a0a2FD8e10682EB7c4F1f1fD'
    let provider_app_key = '0ab4ce267db54906802cb43b24e5b0f7'
    let chain_type = 'matic'
    let provider = new InfuraProvider(chain_type, provider_app_key)

    let abi = [
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "getRECData",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "issuer",
                            "type": "address"
                        },
                        {
                            "internalType": "string",
                            "name": "serialNumber",
                            "type": "string"
                        },
                        {
                            "internalType": "address",
                            "name": "minter",
                            "type": "address"
                        },
                        {
                            "internalType": "uint32",
                            "name": "startTime",
                            "type": "uint32"
                        },
                        {
                            "internalType": "uint32",
                            "name": "endTime",
                            "type": "uint32"
                        },
                        {
                            "internalType": "uint128",
                            "name": "amountREC",
                            "type": "uint128"
                        },
                        {
                            "internalType": "uint8",
                            "name": "status",
                            "type": "uint8"
                        },
                        {
                            "internalType": "string",
                            "name": "cID",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "region",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "url",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "memo",
                            "type": "string"
                        },
                        {
                            "internalType": "uint16",
                            "name": "idAsset",
                            "type": "uint16"
                        }
                    ],
                    "internalType": "struct RECData",
                    "name": "",
                    "type": "tuple"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]

    let contract = new Contract(rec_issuance_contract_address, abi, provider);
    try {
        console.log('contract.getRECData(+tokenId)')
        let nft_obj_array = await contract.getRECData(+tokenId)
        let nft_obj = {
            serialNumber: nft_obj_array[1],
            amountREC: nft_obj_array[5],
            cID: nft_obj_array[7],
            idAsset: nft_obj_array[11]
        }
    
        if (nft_obj.cID === '') {
            log('CID is empty in this token ID!')
            throw 'CID is empty in this token ID!'
        }

        if (nft_obj.idAsset == 1) {
            log('This tool does not support to verify this token ID currently!')
            throw 'This tool does not support to verify this token ID currently!'
        }

        let energy = BigInt(0)

        // Get the files according to the cid in the token
        console.log('client.get(nft_obj.cID)')
        const info = await client.get(nft_obj.cID)

        if (info.ok) {
            console.log('info.files()')
            const files = await info.files();
            log(separator1+ '\n');
            log('There are in total ' + files.length + ' miners!')
            log(separator1+ '\n');

            let count = 1

            // Process each file
            for (let file of files) {
                log('Starting to process miner ' + count)
                log(separator2);

                // Get the file name, which is miner address
                const minerAddress = file.name

                // todo 输出结果
                console.log(currentKey.value, key)
                if (currentKey.value !== key) {
                    return
                }
                minerInfoCb({ type: 'address', value: minerAddress})
                log('The info of miner ' + minerAddress + ' :')
                log('URL'+paddedTab1+'Date'+paddedTab2+'Energy(Wh)')

                // Get the file cid
                const minerCid = file.cid

                let fileInfo = null
                // while (!fileInfo) {
                //     try {
                //         // Get the file content according to the file cid
                //         fileInfo = await client.get(minerCid)
                //     } catch (error) {
                //         log('Got error when get the file content from the cid'+ ' ' + error)
                //         // Delay 10 seconds
                //         log('Will try again after 10 seconds...')
                //         await sleep(10000);
                //     }
                // }
                console.log('client.get(minerCid)')
                fileInfo = await client.get(minerCid)

                if (fileInfo.ok) {
                    console.log('fileInfo.files(), fileInfoFiles[0].arrayBuffer()')
                    const fileInfoFiles = await fileInfo.files()
                    const fileContent = await fileInfoFiles[0].arrayBuffer()
                    const fileContentStr = Buffer.from(fileContent).toString()
                    // Construct the array
                    let array = fileContentStr.split("\r\n")
                    // Remove the empty element in the array
                    const newArray = array.filter(function (str) {
                        return str
                    })
                    let infoArray = newArray.map(
                        s => {
                            let json = {
                                "day": s.substring(0, 10),
                                "cid": s.substring(11)
                            }
                            return json
                        }
                    )

                    // Get the start date of the miner's life cycle
                    console.log('https://api.arkreen.com/v1', 'miner:', minerAddress)
                    const response = await axios.post("https://api.arkreen.com/v1", {
                        jsonrpc: '2.0',
                        method: "rec_getStartDateByMiner",
                        params: {
                            "miner": minerAddress
                        },
                        id: 2,
                    });

                    if (!response.data.error) {
                        const startDate = response.data.result
                        // Get the date of first day for the miner in this AREC
                        const dayFirst = infoArray[0].day

                        // Get the date of the day before the first day
                        let updateDate = new Date(dayFirst);
                        updateDate.setDate(updateDate.getDate() - 1)
                        let dateBefore = updateDate.getUTCFullYear() + "-" + (updateDate.getUTCMonth() < 9 ? '0' + (updateDate.getUTCMonth() + 1) : (updateDate.getUTCMonth() + 1)) + "-" + (updateDate.getUTCDate() < 10 ? '0' + updateDate.getUTCDate() : updateDate.getUTCDate())

                        // Compare the start date of the miner's life cycle and the date of first day for the miner in this AREC
                        if (startDate === dayFirst) {
                            // The two date are same
                            let ele = {
                                "day": dateBefore,
                                "cid": '',
                                "maxEnergy": BigInt(0)
                            }
                            infoArray.unshift(ele)
                        }
                        else {
                            // The two date are different
                            let flag = false
                            do {
                                // Get the day cid of rec before the date of first day for the miner in this AREC
                                console.log('https://api.arkreen.com/v1', 'date:', dateBefore)
                                let cidInfo = await axios.post("https://api.arkreen.com/v1", {
                                    jsonrpc: '2.0',
                                    method: "rec_getDayCid",
                                    params: {
                                        "date": dateBefore.replace(/-/g, '')
                                    },
                                    id: 2,
                                });

                                if (!cidInfo.data.error) {
                                    let cid = cidInfo.data.result.recCid
                                    if (cid != null) {
                                        console.log('client.get(cid)')
                                        let fileRes = await client.get(cid)
                                        // while (!fileRes) {
                                        //     try {
                                        //         // Get the files of the cid
                                        //         fileRes = await client.get(cid)
                                        //     } catch (error) {
                                        //         log('Got error when get the file content from the cid'+ ' ' + error)
                                        //         // Delay 10 seconds
                                        //         log('Will try again after 10 seconds...')
                                        //         await sleep(10000);
                                        //     }
                                        // }

                                        if (fileRes.ok) {
                                            console.log('fileRes.files()')
                                            const fileResFiles = await fileRes.files()

                                            for (let eachFile of fileResFiles) {
                                                // Found the miner
                                                if (eachFile.name == minerAddress) {
                                                    let ele = {
                                                        "day": dateBefore,
                                                        "cid": cid
                                                    }
                                                    infoArray.unshift(ele)
                                                    flag = true
                                                    break
                                                }
                                            }
                                        }
                                        else {
                                            log(`failed to get ${cid} - [${fileRes.status}] ${fileRes.statusText}`)
                                            throw new Error(`failed to get ${cid} - [${fileRes.status}] ${fileRes.statusText}`)
                                        }
                                    }
                                }
                                else {
                                    log(`failed to get the day cid of the date ${dateBefore}`)
                                    throw new Error(`failed to get the day cid of the date ${dateBefore}`)
                                }

                                // Not yet found the miner file in the day cid of rec before the date of first day
                                if (flag == false) {
                                    // Continue to get the day before
                                    let update = new Date(dateBefore);
                                    update.setDate(update.getDate() - 1)
                                    dateBefore = update.getUTCFullYear() + "-" + (update.getUTCMonth() < 9 ? '0' + (update.getUTCMonth() + 1) : (update.getUTCMonth() + 1)) + "-" + (update.getUTCDate() < 10 ? '0' + update.getUTCDate() : update.getUTCDate())
                                }
                            } while (flag == false)
                        }

                        for (let i = 0; i < infoArray.length; i++) {
                            let finalCid = ''

                            if (infoArray[i].cid != '') {
                                let infoArrRes = await client.get(infoArray[i].cid)
                                // while (!infoArrRes) {
                                //     try {
                                //         // Get the files of the cid
                                //         infoArrRes = await client.get(infoArray[i].cid)
                                //     } catch (error) {
                                //         log('Got error when get the file content from the cid'+ ' ' + error)
                                //         // Delay 10 seconds
                                //         log('Will try again after 10 seconds...')
                                //         await sleep(10000);
                                //     }
                                // }

                                if (infoArrRes.ok) {
                                    const infoArrFiles = await infoArrRes.files()

                                    for (let e of infoArrFiles) {
                                        if (e.name == minerAddress) {
                                            finalCid = e.cid
                                            break
                                        }
                                    }
                                }
                                else {
                                    log(`failed to get ${infoArray[i].cid} - [${infoArrRes.status}] ${infoArrRes.statusText}`)
                                    throw new Error(`failed to get ${infoArray[i].cid} - [${infoArrRes.status}] ${infoArrRes.statusText}`)
                                }
                            }

                            if (finalCid === '') {
                                if (i != 0) {
                                    // No any record for this miner in the current cid
                                    // So the value of the current day's max energy is equal to the value of the previous day
                                    // @ts-ignore
                                    infoArray[i].maxEnergy = infoArray[i - 1].maxEnergy
                                }
                            }
                            else {
                                let finalCidRes = await client.get(finalCid)
                                // while (!finalCidRes) {
                                //     try {
                                //         // Get the files of the cid
                                //         finalCidRes = await client.get(finalCid)
                                //     } catch (error) {
                                //         log('Got error when get the file content from the cid'+ ' ' + error)
                                //         // Delay 10 seconds
                                //         log('Will try again after 10 seconds...')
                                //         await sleep(10000);
                                //     }
                                // }

                                if (finalCidRes.ok) {
                                    const res = await finalCidRes.files()
                                    const resBuffer = await res[0].arrayBuffer()
                                    const finalContent = Buffer.from(resBuffer).toString()

                                    // Start to calculate the energy
                                    // Construct the array from the file content
                                    const contentArray = finalContent.split(',\r\n')
                                    const newContentArray = contentArray.filter(function (str) {
                                        return str
                                    })

                                    let dataArray = newContentArray.map(s => {
                                        let jsonFile = JSON.parse(s)
                                        return jsonFile.dataList
                                    }
                                    )
                                    // Sort the array to make sure the elements are sorted by time
                                    dataArray.sort()

                                    // Get the max energy value of the current day
                                    const length1 = dataArray.length
                                    const length2 = dataArray[length1 - 1].length
                                    const maxEnergy = BigInt('0x' + dataArray[length1 - 1][length2 - 1].substring(24))
                                    // @ts-ignore
                                    infoArray[i].maxEnergy = maxEnergy

                                    if (i != 0) {
                                        let dayEnergy = BigInt(0)
                                        for (let k = 0; k < dataArray.length; k++) {
                                            for (let j = 0; j < dataArray[k].length; j++) {
                                                if (j == 0) {
                                                    if (k == 0) {
                                                        // @ts-ignore
                                                        const increase1 = BigInt('0x' + dataArray[k][j].substring(24)) - infoArray[i - 1].maxEnergy
                                                        dayEnergy += increase1
                                                    }
                                                    else {
                                                        const len = dataArray[k - 1].length
                                                        const increase2 = BigInt('0x' + dataArray[k][j].substring(24)) - BigInt('0x' + dataArray[k - 1][len - 1].substring(24))
                                                        dayEnergy += increase2
                                                    }
                                                }
                                                else {
                                                    const increase3 = BigInt('0x' + dataArray[k][j].substring(24)) - BigInt('0x' + dataArray[k][j - 1].substring(24))
                                                    dayEnergy += increase3
                                                }
                                            }
                                        }

                                        let dayE = dayEnergy / BigInt(1000)
                                        let url = "https://" + finalCid + ".ipfs.w3s.link"
                                        // todo 输出结果
                                        console.log(currentKey.value, key)
                                        if (currentKey.value !== key) {
                                            return
                                        }
                                        minerInfoCb({ type: 'record', value: { url, date: infoArray[i].day, energy: dayE }})
                                        log(''+url+';'+infoArray[i].day+';'+dayE+'Wh')
                                        energy += dayEnergy
                                    }
                                }
                                else {
                                    log(`failed to get ${finalCid} - [${finalCidRes.status}] ${finalCidRes.statusText}`)
                                    throw new Error(`failed to get ${finalCid} - [${finalCidRes.status}] ${finalCidRes.statusText}`)
                                }
                            }
                        }
                    }
                    else {
                        log(`failed to get the start date of the miner ${minerAddress}`)
                        throw new Error(`failed to get the start date of the miner ${minerAddress}`)
                    }
                }
                else {
                    log(`failed to get ${minerCid} - [${fileInfo.status}] ${fileInfo.statusText}`)
                    throw new Error(`failed to get ${minerCid} - [${fileInfo.status}] ${fileInfo.statusText}`)
                }

                count += 1
                console.info(separator1+ '\n')
            }
        }
        else {
            log(`failed to get ${nft_obj.cID} - [${info.status}] ${info.statusText}`)
            throw new Error(`failed to get ${nft_obj.cID} - [${info.status}] ${info.statusText}`)
        }


        log('Total energy calculated is '+ energy/BigInt(1000) + ' Wh')
        log('The amount of energy in the AREC token is ' + BigInt(nft_obj.amountREC)/BigInt(1000) + ' Wh')

        // Compare the energy calculated and the one in the AREC token
        if (BigInt(nft_obj.amountREC) == energy) {
            log('Done! Verification succeeded!')
        }
        else {
            log('Done! Verification failed!')
        }

        log(separator1+ '\n')
    } catch (err) {
        log('Got error during the verification process!' + ' ' + err)
        console.error(err)
    }

}


// main().then().catch(error => {
//     console.error(error);
//     process.exit(1);
// });
