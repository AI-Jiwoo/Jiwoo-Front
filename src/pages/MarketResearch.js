// components/MarketResearch.jsx
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    Box, VStack, HStack, Text, Button, Select, Spinner, Input,
    SimpleGrid, Divider, FormControl, FormLabel, Card, CardBody,
    CardHeader, Alert, AlertIcon, Td, Tr, Tbody, Th, Thead,
    Table, ListItem, UnorderedList, Flex, Icon, Tooltip,
    Progress, useDisclosure, Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalBody, ModalCloseButton, TabPanel, TabList,
    Tabs, Tab, TabPanels, Heading, useToast
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaBusinessTime, FaChartLine, FaUsers, FaLightbulb, FaQuestionCircle, FaRedo, FaCopy } from 'react-icons/fa';
import {useBusinesses, useCategories, useMarketAnalysis, useResearchHistory} from "../hooks/useMarketResearch";
import MarketGrowthChart from "../components/MarketGrowthChart";
import LoadingScreen from "../components/common/LoadingMotion";

const queryClient = new QueryClient();

const MarketResearchContent = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [customData, setCustomData] = useState({
        category: '',
        scale: '',
        nation: '',
        customerType: '',
        businessType: '',
        businessContent: '',
        businessPlatform: '',
        businessScale: '',
        investmentStatus: ''
    });
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    // React Query hooks
    const { data: businesses, isLoading: isLoadingBusinesses } = useBusinesses();
    const { data: categories, isLoading: isLoadingCategories } = useCategories();
    const {
        data: historyData,
        isLoading: isLoadingHistory
    } = useResearchHistory(currentPage);
    const marketAnalysisMutation = useMarketAnalysis();

    const handleBusinessSelect = (e) => {
        const selectedId = parseInt(e.target.value);
        const selected = businesses?.find(b => b.id === selectedId);
        setSelectedBusiness(selected ? {...selected} : null);
        if (selected) {
            setCustomData({
                category: selected.category || '',
                scale: selected.businessScale || '',
                nation: selected.businessLocation || '',
                customerType: selected.customerType || '',
                businessType: selected.businessType || '',
                businessContent: selected.businessContent || ''
            });
        } else {
            setCustomData({
                category: '',
                scale: '',
                nation: '',
                customerType: '',
                businessType: '',
                businessContent: ''
            });
        }
    };

    const handleCustomDataChange = (e) => {
        const { name, value } = e.target;
        setCustomData(prev => ({ ...prev, [name]: value }));
    };

    const analyzeMarket = async (type) => {
        if (!selectedBusiness && !customData.category) {
            toast({
                title: "Error",
                description: "사업을 선택하거나 카테고리를 입력해주세요.",
                status: "error",
                duration: 3000,
            });
            return;
        }

        const data = selectedBusiness ? {
            id: selectedBusiness.id,
            businessName: selectedBusiness.businessName,
            businessNumber: selectedBusiness.businessNumber,
            businessContent: selectedBusiness.businessContent,
            businessLocation: selectedBusiness.businessLocation,
            businessStartDate: selectedBusiness.businessStartDate,
            businessPlatform: selectedBusiness.businessPlatform || '',
            businessScale: selectedBusiness.businessScale || '',
            investmentStatus: selectedBusiness.investmentStatus || '',
            customerType: selectedBusiness.customerType || ''
        } : customData;

        try {
            await marketAnalysisMutation.mutateAsync({ type, data });
            setCurrentStep(3);
        } catch (error) {
            toast({
                title: "분석 실패",
                description: "시장 분석 중 오류가 발생했습니다.",
                status: "error",
                duration: 3000,
            });
        }
    };

    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            toast({
                title: "복사 완료",
                description: "내용이 클립보드에 복사되었습니다.",
                status: "success",
                duration: 2000,
                isClosable: true,
            });
        } catch (err) {
            toast({
                title: "복사 실패",
                description: "내용을 복사하는데 실패했습니다.",
                status: "error",
                duration: 2000,
                isClosable: true,
            });
        }
    };

    const handleHistoryClick = (history) => {
        setSelectedHistory(history);
        setIsHistoryModalOpen(true);
    };

    const handleNewAnalysis = () => {
        setSelectedBusiness(null);
        setCustomData({
            category: '',
            scale: '',
            nation: '',
            customerType: '',
            businessType: '',
            businessContent: '',
            businessPlatform: '',
            businessScale: '',
            investmentStatus: ''
        });
        setCurrentStep(1);
        marketAnalysisMutation.reset();
    };

    // Render Functions
    const renderStepIndicator = () => (
        <Box mb={8}>
            <Progress value={(currentStep / 3) * 100} size="sm" colorScheme="blue" />
            <HStack justify="space-between" mt={2}>
                <Text fontWeight={currentStep >= 1 ? "bold" : "normal"}>1. 사업 선택</Text>
                <Text fontWeight={currentStep >= 2 ? "bold" : "normal"}>2. 분석 유형 선택</Text>
                <Text fontWeight={currentStep === 3 ? "bold" : "normal"}>3. 결과 확인</Text>
            </HStack>
        </Box>
    );

    const renderBusinessSelection = () => (
        <Card>
            <CardHeader>
                <HStack>
                    <Icon as={FaBusinessTime} />
                    <Text fontWeight="bold">사업 선택 또는 정보 입력</Text>
                </HStack>
            </CardHeader>
            <CardBody>
                <Select
                    placeholder="사업 선택"
                    onChange={handleBusinessSelect}
                    value={selectedBusiness?.id || ''}
                    mb={4}
                    isDisabled={isLoadingBusinesses}
                >
                    {businesses?.map((business) => (
                        <option key={business.id} value={business.id}>
                            {business.businessName}
                        </option>
                    ))}
                </Select>

                {(!selectedBusiness || businesses?.length === 0) && (
                    <SimpleGrid columns={2} spacing={4}>
                        <FormControl>
                            <FormLabel>사업 분야 (카테고리)</FormLabel>
                            <Select
                                name="category"
                                value={customData.category}
                                onChange={handleCustomDataChange}
                                placeholder="카테고리 선택"
                                isDisabled={isLoadingCategories}
                            >
                                {categories?.map((category, index) => (
                                    <option key={index} value={category}>{category}</option>
                                ))}
                            </Select>
                        </FormControl>
                        {/* Other form controls remain the same */}
                    </SimpleGrid>
                )}

                <Button
                    mt={4}
                    colorScheme="blue"
                    onClick={() => setCurrentStep(2)}
                    isDisabled={!selectedBusiness && !customData.category}
                >
                    다음 단계
                </Button>
            </CardBody>
        </Card>
    );

    const renderAnalysisTypeSelection = () => (
        <Card>
            <CardHeader>
                <HStack>
                    <Icon as={FaChartLine} />
                    <Text fontWeight="bold">분석 유형 선택</Text>
                </HStack>
            </CardHeader>
            <CardBody>
                <SimpleGrid columns={2} spacing={4}>
                    <Tooltip label="시장의 현재 규모와 성장 추세를 분석합니다">
                        <Button
                            leftIcon={<Icon as={FaChartLine} />}
                            onClick={() => analyzeMarket('marketSize')}
                            isLoading={marketAnalysisMutation.isLoading}
                        >
                            시장 규모 분석
                        </Button>
                    </Tooltip>
                    {/* Other analysis type buttons */}
                </SimpleGrid>
            </CardBody>
        </Card>
    );

    const renderResults = () => {
        const { data } = marketAnalysisMutation;

        return (
            <VStack spacing={8} align="stretch">
                {data?.marketInformation && (
                    <Card>
                        <CardHeader>
                            <HStack>
                                <Icon as={FaChartLine} />
                                <Text fontSize="xl" fontWeight="bold">시장 규모 및 성장률</Text>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <MarketGrowthChart data={data.marketInformation} />
                        </CardBody>
                    </Card>
                )}
                {/* Similar cards for competitorAnalysis and marketTrends */}
                <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={handleNewAnalysis}
                    leftIcon={<Icon as={FaRedo} />}
                >
                    새로운 분석 시작
                </Button>
            </VStack>
        );
    };

    const renderResearchHistory = () => (
        <Card>
            <CardHeader>
                <Text fontSize="xl" fontWeight="bold">조회 이력</Text>
            </CardHeader>
            <CardBody>
                {isLoadingHistory ? (
                    <Spinner />
                ) : historyData?.data?.length > 0 ? (
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>날짜</Th>
                                <Th>시장 정보</Th>
                                <Th>경쟁사 분석</Th>
                                <Th>시장 동향</Th>
                                <Th>액션</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {historyData.data.map((history, index) => (
                                <Tr key={index}>
                                    <Td>{new Date(history.createAt).toLocaleString()}</Td>
                                    <Td>{history.marketInformation ? '있음' : '없음'}</Td>
                                    <Td>{history.competitorAnalysis ? '있음' : '없음'}</Td>
                                    <Td>{history.marketTrends ? '있음' : '없음'}</Td>
                                    <Td>
                                        <Button size="sm" onClick={() => handleHistoryClick(history)}>
                                            전체보기
                                        </Button>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                ) : (
                    <Text>조회 이력이 없습니다.</Text>
                )}
            </CardBody>
        </Card>
    );

    // Main render
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <LoadingScreen isLoading={marketAnalysisMutation.isLoading} />
            <Box id="market-research" width="70%" margin="auto" pt={24} pb={12} minHeight="1000px">
                <Box mt={8}/>
                <Flex justifyContent="space-between" alignItems="center" mb={8}>
                    <Heading as="h1" size="2xl" mb={8} wordBreak="break-word">
                        시장 조사💹
                    </Heading>
                    <Tooltip label="도움말">
                        <Icon as={FaQuestionCircle} onClick={onOpen} cursor="pointer" />
                    </Tooltip>
                </Flex>

                {renderStepIndicator()}

                <Tabs isFitted variant="enclosed">
                    <TabList mb="1em">
                        <Tab>시장 분석</Tab>
                        <Tab>조회 이력</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <VStack spacing={8} align="stretch">
                                {currentStep === 1 && renderBusinessSelection()}
                                {currentStep === 2 && renderAnalysisTypeSelection()}
                                {currentStep === 3 && renderResults()}

                                {marketAnalysisMutation.isError && (
                                    <Alert status="error">
                                        <AlertIcon />
                                        시장 분석 중 오류가 발생했습니다.
                                    </Alert>
                                )}
                            </VStack>
                        </TabPanel>
                        <TabPanel>
                            {renderResearchHistory()}
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </motion.div>
    );
};

const MarketResearch = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <MarketResearchContent />
        </QueryClientProvider>
    );
};

export default MarketResearch;