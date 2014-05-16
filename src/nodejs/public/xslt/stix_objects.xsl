<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:fn="http://www.w3.org/2005/xpath-functions"
  

  xmlns:cybox="http://cybox.mitre.org/cybox-2"
  xmlns:Common="http://cybox.mitre.org/common-2"
  xmlns:stix="http://stix.mitre.org/stix-1"
  xmlns:stixCommon="http://stix.mitre.org/common-1"
  xmlns:indicator="http://stix.mitre.org/Indicator-2"
  
  exclude-result-prefixes="cybox Common xsi fn xs stix stixCommon indicator"
  
  version="2.0">
  
  <!--
    ····························································
  -->
  
  <!--
    sample template for displaying sightings and sighting elements
  -->
  <xsl:template match="indicator:Sightings">
    <div class="sightings">
    
      <div>
      <xsl:apply-templates select="indicator:Sighting" />
    </div>
    </div>
  </xsl:template>
  
  <xsl:template match="indicator:Sighting">
    <div class="sighting">
      <div>
        <!-- SIGHTING <xsl:value-of select="position()" /> of <xsl:value-of select="count(../indicator:Sighting)" /> -->
      </div>
      <div>
        <xsl:value-of select="fn:data(@timestamp)" />
      </div>
    </div>
  </xsl:template>
  
  <!--
  ····························································
  -->
  
  <!--
    purpose: template for displayin descriptions from any namespace.  very
    simple, but useful for adding a css class so that they can be styled
    across any content type.
    
    hint: this is used to enable the option to turn on css styles to preserve
    line breaks for preformatted description that show up in some documents.
  -->
  <xsl:template match="*:Description">
    <div class="description">
      <xsl:value-of select="text()" />
    </div>
  </xsl:template>
    
</xsl:stylesheet>